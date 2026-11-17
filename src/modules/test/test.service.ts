import { getTestProgress } from '../../lib/marksDue.js';
import prisma, { LIVE_SCORES, rethrowUniqueViolation } from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateTest, IGetAllTestsQuery, IImportTests, ITestSubjectInput, IUpdateTest, TestMessages } from './index.js';
import {
  cleanText,
  countRows,
  dayInWords,
  IImportResult,
  IImportRowResult,
  monthInWords,
  nameKey,
  parseDay,
  parseMonth,
  plural,
  refuseProblems,
} from '../../lib/import.js';
import { Prisma, TestType } from '@prisma/client';

// What every test response carries. The Tests table and the edit form both read `class`,
// so create and update must return it too, not just the list.
const TEST_PUBLIC_FIELDS = {
  externalId: true,
  name: true,
  testType: true,
  month: true,
  year: true,
  testDate: true,
  totalMarks: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  class: { select: { externalId: true, name: true } },
} satisfies Prisma.TestSelect;

// The date leaves as YYYY-MM-DD, like the school year start
const toPublicTest = <T extends { testDate: Date | null }>(test: T) => ({
  ...test,
  testDate: test.testDate ? test.testDate.toISOString().slice(0, 10) : null,
});

// Where a test sits in time. A session test is placed by its day, and its month and year
// come from it, so conduct, the dashboard and the uniqueness rule keep working by month.
const placeTest = (
  testType: TestType,
  given: { month?: number; year?: number; testDate?: string | null },
): { month: number; year: number; testDate: Date | null } => {
  if (testType === TestType.SESSION) {
    if (!given.testDate) {
      throw ApiError.format('', TestMessages.SESSION_DATE_REQUIRED);
    }
    const [year, month] = given.testDate.split('-').map(Number);
    return { month, year, testDate: new Date(given.testDate) };
  }

  if (!given.month || !given.year) {
    throw ApiError.format('', TestMessages.MONTH_YEAR_REQUIRED);
  }
  return { month: given.month, year: given.year, testDate: null };
};

class TestService {
  // Same shape as the list
  private async withProgress(result: IAPISuccessResponse): Promise<IAPISuccessResponse> {
    const { externalId } = result.test as { externalId: string };
    const row = await prisma.test.findUniqueOrThrow({ where: { externalId }, select: { id: true } });
    const progress = (await getTestProgress([row.id])).get(row.id);

    return {
      ...result,
      test: {
        ...(result.test as object),
        marksEntered: progress?.entered ?? 0,
        marksExpected: progress?.expected ?? 0,
      },
    };
  }

  async createTest(payload: ICreateTest): Promise<IAPISuccessResponse> {
    const result = await prisma.$transaction(async (tx) => {
      // 1️⃣ Get class
      const classData = await tx.class.findUnique({
        where: {
          externalId: payload.classExternalId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!classData) {
        throw ApiError.format('', TestMessages.CLASS_NOT_FOUND);
      }

      // 2️⃣ Its month and year, from the date for a session test
      const when = placeTest(payload.testType, payload);

      // 3️⃣ Check duplicate test
      const existingTest = await tx.test.findFirst({
        where: {
          classId: classData.id,
          name: payload.name,
          month: when.month,
          year: when.year,
          testType: payload.testType,
          isActive: true,
          deletedAt: null,
        },
      });

      if (existingTest) {
        throw ApiError.format('', TestMessages.TEST_ALREADY_EXISTS);
      }

      // 4️⃣ Resolve each subject to a SubjectClass row for THIS class
      const resolvedSubjects: { subjectClassId: number; maxMarks: number }[] = [];

      for (const item of payload.subjects) {
        const subjectClass = await tx.subjectClass.findFirst({
          where: {
            classId: classData.id,
            subject: {
              externalId: item.subjectExternalId,
              isActive: true,
              deletedAt: null,
            },
            deletedAt: null,
          },
        });

        if (!subjectClass) {
          throw ApiError.format('', TestMessages.SUBJECT_NOT_IN_CLASS);
        }

        resolvedSubjects.push({ subjectClassId: subjectClass.id, maxMarks: item.maxMarks });
      }

      // 5️⃣ Derive the authoritative total from the subjects
      const totalMarks = resolvedSubjects.reduce((sum, s) => sum + s.maxMarks, 0);

      // 6️⃣ Create test
      const createdTest = await tx.test
        .create({
          data: {
            name: payload.name,
            testType: payload.testType,
            ...when,
            totalMarks,
            classId: classData.id,
          },
        })
        .catch(rethrowUniqueViolation(TestMessages.TEST_ALREADY_EXISTS));

      // 7️⃣ Create its TestSubject rows — a test can never exist without them
      await tx.testSubject.createMany({
        data: resolvedSubjects.map((s) => ({
          testId: createdTest.id,
          subjectClassId: s.subjectClassId,
          maxMarks: s.maxMarks,
          createdBy: payload.createdBy ?? null,
        })),
      });

      const test = await tx.test.findUniqueOrThrow({
        where: { id: createdTest.id },
        select: TEST_PUBLIC_FIELDS,
      });

      return {
        keyName: 'test',
        test: toPublicTest(test),
        code: TestMessages.TEST_CREATED_SUCCESSFULLY.code,
        message: TestMessages.TEST_CREATED_SUCCESSFULLY.message,
        success: true,
      };
    });

    return this.withProgress(result);
  }

  // One row per test and subject; rows with the same class, name, type and month (or date) are
  // one test. A test already in the class is skipped whole. Max marks left blank take the
  // subject's own. Same rules as the Tests form.
  async importTests({ dryRun, classId, rows, createdBy }: IImportTests): Promise<IAPISuccessResponse> {
    const classes = await prisma.class.findMany({
      where: { isActive: true, deletedAt: null },
      select: { id: true, externalId: true, name: true },
    });
    let fixedClass: (typeof classes)[number] | undefined;
    if (classId) {
      fixedClass = classes.find((c) => c.externalId === classId);
      if (!fixedClass) throw ApiError.format('', TestMessages.CLASS_NOT_FOUND);
    }
    const classKeys = classes.map((c) => nameKey(c.name));
    const classByKey = new Map(classes.map((c) => [nameKey(c.name), c]));
    const classTwice = new Set(classKeys.filter((k, i) => classKeys.indexOf(k) !== i));

    const [links, existingTests] = await Promise.all([
      prisma.subjectClass.findMany({
        where: { deletedAt: null, subject: { isActive: true, deletedAt: null } },
        select: { id: true, classId: true, subject: { select: { name: true, maxMarks: true } } },
      }),
      prisma.test.findMany({
        where: { deletedAt: null },
        select: { classId: true, name: true, month: true, year: true, testType: true },
      }),
    ]);
    // The uniqueness rule: class, name, month, year and type
    const testKey = (cls: number, name: string, type: TestType, month: number, year: number) =>
      `${cls}|${nameKey(name)}|${type}|${year}-${month}`;
    const lastYear = new Date().getFullYear() + 1;
    const existing = new Set(existingTests.map((t) => testKey(t.classId, t.name, t.testType, t.month, t.year)));

    type Group = {
      classId: number;
      name: string;
      testType: TestType;
      month: number;
      year: number;
      testDate: string | null;
      firstRow: number;
      subjects: Map<number, { row: number; maxMarks: number }>;
    };
    const groups = new Map<string, Group>();
    const skippedTests = new Set<string>();

    const results: IImportRowResult[] = rows.map((input) => {
      const problems: string[] = [];
      const name = cleanText(input.name);
      const subjectName = cleanText(input.subject);

      let cls = fixedClass;
      if (!cls) {
        const className = cleanText(input.className);
        if (!className) problems.push('The class is missing');
        else if (classTwice.has(nameKey(className))) {
          problems.push(`More than one class is called ${className} (different capitals). Rename one first`);
        } else {
          cls = classByKey.get(nameKey(className));
          if (!cls) problems.push(`There is no class called ${className}`);
        }
      }

      if (!name) problems.push('The test name is missing');
      else if (name.length > 50) problems.push('The test name must be at most 50 characters');

      const typeText = nameKey(input.testType);
      const testType = ['monthly', 'month', 'm'].includes(typeText)
        ? TestType.MONTHLY
        : ['session', 'test session', 'session test', 's'].includes(typeText)
          ? TestType.SESSION
          : null;
      if (!typeText) problems.push('Type is missing. Use Monthly or Session');
      else if (!testType) problems.push('Type must be Monthly or Session');

      // Where the test sits in time, as the Tests form places it
      let month: number | undefined;
      let year: number | undefined;
      let testDate: string | null = null;
      if (testType === TestType.SESSION) {
        const day = cleanText(input.testDate) ? parseDay(input.testDate) : null;
        if (!cleanText(input.testDate)) problems.push('A session test needs its date');
        else if (!day) problems.push('The date must be a date, e.g. 2026-09-15 or 15/9/2026');
        else {
          testDate = day;
          [year, month] = day.split('-').map(Number);
          if (year < 2000 || year > lastYear) problems.push(`Pick a date from 2000 to ${lastYear}`);
          // Month or Year cells that disagree with the date are probably a typo somewhere
          const saidMonth = cleanText(input.month) ? parseMonth(input.month) : null;
          const saidYear = cleanText(input.year);
          if ((saidMonth && saidMonth.month !== month) || (saidYear && saidYear !== String(year))) {
            problems.push(`The Month or Year cell doesn't match the date ${dayInWords(day)}`);
          }
        }
      } else if (testType === TestType.MONTHLY) {
        const fromMonth = cleanText(input.month) ? parseMonth(input.month) : null;
        const fromDate = !cleanText(input.month) && cleanText(input.testDate) ? parseMonth(input.testDate) : null;
        const given = fromMonth ?? fromDate;
        const yearText = cleanText(input.year);
        if (cleanText(input.month) && !fromMonth) problems.push('Month must be a month, e.g. April, Apr or 4');
        else if (!given) problems.push('A monthly test needs its month');
        else month = given.month;
        if (/^\d{4}$/.test(yearText)) year = Number(yearText);
        else if (yearText) problems.push('Year must be a year, e.g. 2026');
        else if (given?.year) year = given.year;
        else if (given) problems.push('A monthly test needs its year');
        if (year !== undefined && given?.year && given.year !== year) {
          problems.push(`The Month cell says ${given.year} but the Year cell says ${year}`);
        }
        // As the Tests form: Reports can't pick a later year, so its card could never print
        if (year !== undefined && year < 2000) problems.push('Enter a year from 2000');
        else if (year !== undefined && year > lastYear) problems.push("Year can't be past next year");
      } else {
        // The type is unknown, but cells that are filled in can still be checked now
        if (cleanText(input.month) && !parseMonth(input.month))
          problems.push('Month must be a month, e.g. April, Apr or 4');
        if (cleanText(input.year) && !/^\d{4}$/.test(cleanText(input.year)))
          problems.push('Year must be a year, e.g. 2026');
        if (cleanText(input.testDate) && !parseDay(input.testDate)) {
          problems.push('The date must be a date, e.g. 2026-09-15 or 15/9/2026');
        }
      }

      // A test already in the class is skipped whole, so its rows' subjects and marks don't
      // matter (a subject removed from the class since mustn't block the rest of the file)
      if (
        !problems.length &&
        cls &&
        testType &&
        month &&
        year &&
        existing.has(testKey(cls.id, name, testType, month, year))
      ) {
        const when = testDate ? dayInWords(testDate) : monthInWords(month, year);
        skippedTests.add(testKey(cls.id, name, testType, month, year));
        return {
          row: input.row,
          label: `${name}, ${when}, ${cls.name}` + (subjectName ? `: ${subjectName}` : ''),
          status: 'exists',
          messages: [`${name} for ${when} is already in ${cls.name}, so it is skipped`],
        };
      }

      let subjectClassId: number | undefined;
      let defaultMarks: number | undefined;
      if (!subjectName) problems.push('The subject is missing');
      else if (cls) {
        const matches = links.filter((l) => l.classId === cls.id && nameKey(l.subject.name) === nameKey(subjectName));
        if (matches.length > 1) {
          problems.push(`More than one subject in ${cls.name} is called ${subjectName} (different capitals)`);
        } else if (!matches.length) problems.push(`${subjectName} isn't offered in ${cls.name}`);
        else {
          subjectClassId = matches[0].id;
          defaultMarks = matches[0].subject.maxMarks;
        }
      }

      const marksText = cleanText(input.maxMarks);
      let maxMarks = defaultMarks;
      if (marksText) {
        maxMarks = /^\d+$/.test(marksText) ? Number(marksText) : undefined;
        if (!maxMarks || maxMarks > 10000) problems.push('Max marks must be a whole number from 1 to 10000');
      }

      const when = testDate ? dayInWords(testDate) : month && year ? monthInWords(month, year) : '';
      const label =
        [name || '(no name)', when, cls?.name].filter(Boolean).join(', ') + (subjectName ? `: ${subjectName}` : '');
      const done = (status: IImportRowResult['status'], messages: string[]): IImportRowResult => ({
        row: input.row,
        label,
        status,
        messages,
      });

      if (problems.length || !cls || !testType || !month || !year || !subjectClassId || !maxMarks) {
        return done('problem', problems);
      }

      const key = testKey(cls.id, name, testType, month, year);

      const group = groups.get(key);
      if (group && group.testDate !== testDate) {
        return done('problem', [
          `${name} is also on row ${group.firstRow} with the date ${dayInWords(group.testDate!)}. A test name can be used once a month`,
        ]);
      }
      if (group?.subjects.has(subjectClassId)) {
        return done('problem', [
          `${subjectName} is already on row ${group.subjects.get(subjectClassId)!.row} for this test`,
        ]);
      }
      const target = group ?? {
        classId: cls.id,
        name,
        testType,
        month,
        year,
        testDate,
        firstRow: input.row,
        subjects: new Map(),
      };
      target.subjects.set(subjectClassId, { row: input.row, maxMarks });
      groups.set(key, target);
      return done('new', [`Out of ${maxMarks}${marksText ? '' : " (the subject's max marks)"}`]);
    });

    const answer: IImportResult = { dryRun, counts: countRows(results), rows: results, toCreate: groups.size };
    if (dryRun) {
      return { keyName: 'testImport', testImport: answer, ...TestMessages.TEST_IMPORT_CHECKED };
    }

    refuseProblems(results, TestMessages.TEST_IMPORT_HAS_PROBLEMS);

    const created = await prisma
      .$transaction(
        async (tx) => {
          const ids: number[] = [];
          for (const group of groups.values()) {
            const subjects = [...group.subjects.entries()];
            const test = await tx.test.create({
              data: {
                name: group.name,
                testType: group.testType,
                month: group.month,
                year: group.year,
                testDate: group.testDate ? new Date(group.testDate) : null,
                totalMarks: subjects.reduce((sum, [, s]) => sum + s.maxMarks, 0),
                classId: group.classId,
                createdBy: createdBy ?? null,
              },
              select: { id: true },
            });
            await tx.testSubject.createMany({
              data: subjects.map(([subjectClassId, s]) => ({
                testId: test.id,
                subjectClassId,
                maxMarks: s.maxMarks,
                createdBy: createdBy ?? null,
              })),
            });
            ids.push(test.id);
          }
          return tx.test.findMany({ where: { id: { in: ids } }, select: TEST_PUBLIC_FIELDS, orderBy: { id: 'asc' } });
        },
        { timeout: 60_000 },
      )
      .catch(rethrowUniqueViolation(TestMessages.TEST_ALREADY_EXISTS));

    answer.created = created.map(toPublicTest);
    const skipped = skippedTests.size ? `, ${skippedTests.size} already there` : '';
    return {
      keyName: 'testImport',
      testImport: answer,
      code: TestMessages.TEST_IMPORT_DONE.code,
      message: `${plural(created.length, 'test', 'tests')} imported${skipped}`,
      success: true,
    };
  }

  async updateTest(externalId: string, payload: IUpdateTest): Promise<IAPISuccessResponse> {
    const existingTest = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
    });

    if (!existingTest) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    // Resolve classId only if classExternalId is provided
    let classId = existingTest.classId;

    if (payload.classExternalId) {
      const classData = await prisma.class.findFirst({
        where: { externalId: payload.classExternalId, isActive: true, deletedAt: null },
      });

      if (!classData) {
        throw ApiError.format('', TestMessages.CLASS_NOT_FOUND);
      }

      classId = classData.id;
    }

    const testType = payload.testType ?? existingTest.testType;

    // A test with marks belongs to the class that sat it: moving it would put those marks
    // under the wrong class on the card and leave the new class's students with gaps.
    // Its type is fixed the same way, or its marks would move to the other kind of card.
    if (classId !== existingTest.classId || testType !== existingTest.testType) {
      const markCount = await prisma.studentScore.count({
        where: { ...LIVE_SCORES, testSubject: { testId: existingTest.id } },
      });

      if (markCount > 0) {
        throw ApiError.format(
          '',
          classId !== existingTest.classId ? TestMessages.TEST_CLASS_LOCKED : TestMessages.TEST_TYPE_LOCKED,
        );
      }
    }

    // Fields left out keep their saved values
    const when = placeTest(testType, {
      month: payload.month ?? existingTest.month,
      year: payload.year ?? existingTest.year,
      testDate: payload.testDate ?? existingTest.testDate?.toISOString().slice(0, 10),
    });

    // Duplicate check (exclude current test). Fields left out of the payload keep their saved
    // values: Prisma ignores `undefined`, which would otherwise match any test in the class.
    const duplicate = await prisma.test.findFirst({
      where: {
        id: { not: existingTest.id },
        classId: classId,
        name: payload.name ?? existingTest.name,
        month: when.month,
        year: when.year,
        testType,
        isActive: true,
        deletedAt: null,
      },
    });

    if (duplicate) {
      throw ApiError.format('', TestMessages.TEST_ALREADY_EXISTS);
    }

    // One transaction, so a refused subject change can't leave the other fields saved
    const updatedTest = await prisma.$transaction(async (tx) => {
      const test = await tx.test
        .update({
          where: { id: existingTest.id },
          data: {
            name: payload.name,
            testType,
            ...when,
            totalMarks: payload.totalMarks,
            classId: classId,
          },
        })
        .catch(rethrowUniqueViolation(TestMessages.TEST_ALREADY_EXISTS));

      if (payload.subjects) {
        await this.replaceTestSubjects(tx, test, payload.subjects);
      }

      return tx.test.findUniqueOrThrow({ where: { id: test.id }, select: TEST_PUBLIC_FIELDS });
    });

    return this.withProgress({
      keyName: 'test',
      test: toPublicTest(updatedTest),
      code: TestMessages.TEST_UPDATED_SUCCESSFULLY.code,
      message: TestMessages.TEST_UPDATED_SUCCESSFULLY.message,
      success: true,
    });
  }
  async deleteTest(externalId: string): Promise<IAPISuccessResponse> {
    const test = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
    });

    if (!test) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    // Its marks would leave every card, with no way back
    const markCount = await prisma.studentScore.count({
      where: { ...LIVE_SCORES, testSubject: { testId: test.id, deletedAt: null } },
    });

    if (markCount > 0) {
      throw ApiError.format('', TestMessages.TEST_HAS_MARKS);
    }

    await prisma.test.update({
      where: { id: test.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      keyName: 'test',
      code: TestMessages.TEST_DELETED_SUCCESSFULLY.code,
      message: TestMessages.TEST_DELETED_SUCCESSFULLY.message,
      success: true,
    };
  }
  async getAllTests(query: IGetAllTestsQuery): Promise<IAPISuccessResponse> {
    const { classExternalId, month, year } = query;
    const whereCondition: Prisma.TestWhereInput = {
      isActive: true,
      deletedAt: null,
      class: { deletedAt: null },
    };
    if (classExternalId) {
      const classData = await prisma.class.findUnique({
        where: { externalId: classExternalId, isActive: true, deletedAt: null },
      });

      if (!classData) {
        throw ApiError.format('', TestMessages.CLASS_NOT_FOUND);
      }

      whereCondition.classId = classData.id;
    }

    if (month) {
      whereCondition.month = Number(month);
    }

    if (year) {
      whereCondition.year = Number(year);
    }

    const tests = await prisma.test.findMany({
      where: whereCondition,
      select: { ...TEST_PUBLIC_FIELDS, id: true },
      // A session test's day, then id, break ties between tests in the same month
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { testDate: { sort: 'desc', nulls: 'last' } }, { id: 'desc' }],
    });

    const progress = await getTestProgress(tests.map((test) => test.id));

    return {
      keyName: 'tests',
      tests: tests.map(({ id, ...test }) => ({
        ...toPublicTest(test),
        marksEntered: progress.get(id)?.entered ?? 0,
        marksExpected: progress.get(id)?.expected ?? 0,
      })),
      code: TestMessages.TESTS_LIST_FETCHED_SUCCESSFULLY.code,
      message: TestMessages.TESTS_LIST_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }
  async getTestById(externalId: string): Promise<IAPISuccessResponse> {
    const test = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
      select: TEST_PUBLIC_FIELDS,
    });

    if (!test) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    return {
      keyName: 'test',
      test: toPublicTest(test),
      code: TestMessages.TEST_FETCHED_SUCCESSFULLY.code,
      message: TestMessages.TEST_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getTestSubjects(externalId: string): Promise<IAPISuccessResponse> {
    const test = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
    });

    if (!test) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    const testSubjects = await prisma.testSubject.findMany({
      where: { testId: test.id, deletedAt: null },
      include: { subjectClass: { include: { subject: true } } },
      orderBy: { id: 'asc' },
    });

    return {
      keyName: 'testSubjects',
      testSubjects: testSubjects.map((ts) => ({
        externalId: ts.externalId,
        subject: {
          externalId: ts.subjectClass.subject.externalId,
          name: ts.subjectClass.subject.name,
        },
        maxMarks: ts.maxMarks,
      })),
      code: TestMessages.TEST_SUBJECTS_FETCHED_SUCCESSFULLY.code,
      message: TestMessages.TEST_SUBJECTS_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  // Makes the test's subjects match `subjects`. Runs inside the caller's transaction.
  private async replaceTestSubjects(
    tx: Prisma.TransactionClient,
    test: { id: number; classId: number },
    subjects: ITestSubjectInput[],
  ): Promise<void> {
    // ALL TestSubject rows ever created for this test, active or soft-deleted. We need the
    // soft-deleted ones too: @@unique([testId, subjectClassId]) means re-adding a subject that
    // was previously removed from this test must resurrect its old row, not INSERT a duplicate.
    const allTestSubjects = await tx.testSubject.findMany({
      where: { testId: test.id },
      include: { scores: { where: LIVE_SCORES }, subjectClass: { include: { subject: true } } },
    });

    // A subject already on this test stays on its own row, even if it has since been removed
    // from the class. Only a subject new to the test must be assigned to the class. Rows of
    // another class don't count: the test has just been moved.
    const onTestBySubject = new Map(
      allTestSubjects
        .filter((ts) => ts.deletedAt === null && ts.subjectClass.classId === test.classId)
        .map((ts) => [ts.subjectClass.subject.externalId, ts.subjectClassId]),
    );

    const resolvedSubjects: { subjectClassId: number; maxMarks: number }[] = [];

    for (const item of subjects) {
      const onTest = onTestBySubject.get(item.subjectExternalId);
      if (onTest !== undefined) {
        resolvedSubjects.push({ subjectClassId: onTest, maxMarks: item.maxMarks });
        continue;
      }

      const subjectClass = await tx.subjectClass.findFirst({
        where: {
          classId: test.classId,
          subject: {
            externalId: item.subjectExternalId,
            isActive: true,
            deletedAt: null,
          },
          deletedAt: null,
        },
      });

      if (!subjectClass) {
        throw ApiError.format('', TestMessages.SUBJECT_NOT_IN_CLASS);
      }

      resolvedSubjects.push({ subjectClassId: subjectClass.id, maxMarks: item.maxMarks });
    }

    const activeTestSubjects = allTestSubjects.filter((ts) => ts.deletedAt === null);
    const incomingSubjectClassIds = resolvedSubjects.map((s) => s.subjectClassId);

    // Rows present now but missing from the incoming set — being removed
    const toRemove = activeTestSubjects.filter((ts) => !incomingSubjectClassIds.includes(ts.subjectClassId));

    const removalBlockedBy = toRemove.find((ts) => ts.scores.length > 0);
    if (removalBlockedBy) {
      throw ApiError.format(
        {
          message: `Cannot remove subject "${removalBlockedBy.subjectClass.subject.name}" — marks have already been entered for it`,
          code: TestMessages.TEST_SUBJECT_HAS_SCORES.code,
        },
        TestMessages.TEST_SUBJECT_HAS_SCORES,
      );
    }

    // Soft-delete removed rows
    if (toRemove.length > 0) {
      await tx.testSubject.updateMany({
        where: { id: { in: toRemove.map((ts) => ts.id) } },
        data: { deletedAt: new Date() },
      });
    }

    // Upsert the rest — resurrecting (deletedAt: null) any row that was previously soft-deleted
    const existingBySubjectClassId = new Map(allTestSubjects.map((ts) => [ts.subjectClassId, ts]));

    // A card would otherwise show e.g. 80/50, and a row over 100% has no grade band
    for (const item of resolvedSubjects) {
      const existing = existingBySubjectClassId.get(item.subjectClassId);
      if (existing?.scores.some((score) => score.marksObtained > item.maxMarks)) {
        throw ApiError.format(
          {
            message: `Max marks for "${existing.subjectClass.subject.name}" can't be lower than a mark already entered`,
            code: TestMessages.MAX_MARKS_BELOW_SCORES.code,
          },
          TestMessages.MAX_MARKS_BELOW_SCORES,
        );
      }
    }

    for (const item of resolvedSubjects) {
      const existing = existingBySubjectClassId.get(item.subjectClassId);

      if (existing) {
        await tx.testSubject.update({
          where: { id: existing.id },
          data: { maxMarks: item.maxMarks, deletedAt: null },
        });
      } else {
        await tx.testSubject.create({
          data: {
            testId: test.id,
            subjectClassId: item.subjectClassId,
            maxMarks: item.maxMarks,
          },
        });
      }
    }

    // Recompute the authoritative total from the subjects
    const totalMarks = resolvedSubjects.reduce((sum, s) => sum + s.maxMarks, 0);

    await tx.test.update({
      where: { id: test.id },
      data: { totalMarks },
    });
  }
}

export default new TestService();
