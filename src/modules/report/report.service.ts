import { Prisma } from '@prisma/client';
import prisma from '../../lib/prisma.js';
import { joinedMonthIndex, monthIndex, owesTest } from '../../lib/marksDue.js';
import { ApiError } from '../../common/responses/index.js';
import { GradeService } from '../grade/index.js';
import {
  IReportCard,
  IReportCardPosition,
  IReportCardRow,
  IReportPeriod,
  IReportQuery,
  ReportMessages,
} from './index.js';

// The nudge stops 14.375, stored as 14.37499..., rounding down
const round2 = (value: number): number => Math.round(value * 100 + 1e-9) / 100;

const isoDay = (date: Date | null): string | null => (date ? date.toISOString().slice(0, 10) : null);

// The group ranked for a class, the same on every card: its current students, plus anyone who
// only left after the period ended. A current student can have joined "after" a test whose marks
// were entered later, so their date alone can't rule them out.
const inClassAtPeriodEnd = (
  student: { classId: number; classSince: Date },
  classId: number,
  period: IReportPeriod,
): boolean => student.classId === classId || joinedMonthIndex(student.classSince) > monthIndex(period.to);

// Tests and conduct both record a month and a year
const inPeriod = ({ from, to }: IReportPeriod) => ({
  AND: [
    { OR: [{ year: { gt: from.year } }, { year: from.year, month: { gte: from.month } }] },
    { OR: [{ year: { lt: to.year } }, { year: to.year, month: { lte: to.month } }] },
  ],
});

const studentMarkOf = (studentId: number) => ({ studentId, deletedAt: null });

const cardTestInclude = (studentId: number) =>
  ({
    class: { select: { name: true } },
    testSubjects: {
      where: { deletedAt: null },
      include: { scores: { where: studentMarkOf(studentId) }, subjectClass: { include: { subject: true } } },
    },
  }) satisfies Prisma.TestInclude;

type CardTest = Prisma.TestGetPayload<{ include: ReturnType<typeof cardTestInclude> }>;

type CardStudent = { id: number; classId: number; classSince: Date; takenSubjectIds: Set<number> };

// The tests a card is made of, and how to find the same tests for the rest of the class
interface ICardSource {
  tests: CardTest[];
  // Session cards: tests before the range, printed as one row
  earlier: CardTest[];
  period: IReportPeriod;
  range: IReportCard['range'];
  classTests: (classId: number) => Prisma.TestWhereInput;
}

class ReportService {
  async getStudentReport(studentExternalId: string, query: IReportQuery): Promise<IAPISuccessResponse> {
    const student = await prisma.student.findUnique({
      where: { externalId: studentExternalId, isActive: true, deletedAt: null },
      include: {
        class: true,
        studentSubjects: { select: { subjectClass: { select: { subjectId: true } } } },
      },
    });

    if (!student) {
      throw ApiError.format('', ReportMessages.STUDENT_NOT_FOUND);
    }

    const institute = await prisma.institute.findFirst({ where: { deletedAt: null }, orderBy: { id: 'asc' } });

    if (!institute) {
      throw ApiError.format('', ReportMessages.INSTITUTE_NOT_CONFIGURED);
    }

    const source =
      query.mode === 'MONTHLY'
        ? await this.monthlySource(student, query.period)
        : await this.sessionSource(student.id, query, institute.schoolYearStartDate);

    const cardStudent: CardStudent = {
      id: student.id,
      classId: student.classId,
      classSince: student.classSince,
      takenSubjectIds: new Set(student.studentSubjects.map((ss) => ss.subjectClass.subjectId)),
    };

    // Keyed by subject, not SubjectClass: Maths in the old class and the new one is one column
    const subjectById = new Map<number, { externalId: string; name: string }>();
    const missingMarks: IReportCard['missingMarks'] = [];

    const main = await this.buildRows(source.tests, cardStudent, subjectById, missingMarks);
    const earlier = await this.buildRows(source.earlier, cardStudent, subjectById, missingMarks);
    const summaryRow = earlier.rows.length ? await this.summaryRow(earlier.rows) : null;

    const rows = summaryRow ? [summaryRow, ...main.rows] : main.rows;
    const cardTests = [...earlier.cardTests, ...main.cardTests];

    // Sorted by subject, so every student in a class gets the same column order
    const subjects = Array.from(subjectById.entries())
      .sort(([a], [b]) => a - b)
      .map(([, subject]) => subject);

    const subjectTotals: IReportCard['subjectTotals'] = {};

    for (const { externalId } of subjects) {
      let obtained = 0;
      let max = 0;

      for (const row of rows) {
        const cell = row.marks[externalId];
        if (cell && cell.obtained !== null) {
          obtained += cell.obtained;
          max += cell.max;
        }
      }

      subjectTotals[externalId] = { obtained, max };
    }

    const obtainedMarks = rows.reduce((sum, row) => sum + row.total, 0);
    const totalMarks = rows.reduce((sum, row) => sum + row.maxTotal, 0);
    const overallPercentage = totalMarks ? round2((obtainedMarks / totalMarks) * 100) : null;
    const overallResult =
      overallPercentage === null ? null : await GradeService.resolveGradeForPercentage(overallPercentage);

    // Conduct is recorded per month, so the card shows the latest month in its period
    const conductRow = await prisma.studentConduct.findFirst({
      where: { studentId: student.id, deletedAt: null, ...inPeriod(source.period) },
      orderBy: [{ year: 'desc' }, { month: 'desc' }, { id: 'desc' }],
    });

    const cardClasses = [...new Set(cardTests.map((test) => test.class.name))];

    const report: IReportCard = {
      institute: { name: institute.name, address: institute.address, phone: institute.phone, logo: institute.logo },
      student: {
        name: `${student.firstName} ${student.lastName}`.trim(),
        fatherName: student.fatherName,
        // The class the card's tests were taken in, which differs from today's after a promotion
        class: cardClasses.length ? cardClasses.join(' / ') : student.class.name,
        rollNumber: student.rollNumber,
      },
      mode: query.mode,
      title: query.mode === 'MONTHLY' ? 'MONTHLY ASSESSMENT REPORT' : 'TEST SESSION REPORT',
      period: source.period,
      range: source.range,
      subjects,
      rows,
      subjectTotals,
      overall: {
        obtainedMarks,
        totalMarks,
        percentage: overallPercentage,
        grade: overallResult?.grade ?? null,
        status: overallResult ? (overallResult.failing ? 'FAIL' : 'PASS') : null,
        remarks: overallResult?.remarks ?? '',
      },
      conduct: {
        behaviour: conductRow?.behaviour ?? null,
        uniformCleanliness: conductRow?.uniformCleanliness ?? null,
        month: conductRow?.month ?? null,
        year: conductRow?.year ?? null,
      },
      position: await this.computePosition(student.id, source, cardTests),
      missingMarks,
    };

    return {
      keyName: 'report',
      report,
      code: ReportMessages.REPORT_FETCHED_SUCCESSFULLY.code,
      message: ReportMessages.REPORT_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  // The current class's monthly tests, plus any other monthly test the student has a mark on,
  // so marks earned before a class move or promotion stay on the card.
  private async monthlySource(student: { id: number; classId: number }, period: IReportPeriod): Promise<ICardSource> {
    const tests = await prisma.test.findMany({
      where: {
        testType: 'MONTHLY',
        ...inPeriod(period),
        isActive: true,
        deletedAt: null,
        OR: [
          { classId: student.classId },
          { testSubjects: { some: { deletedAt: null, scores: { some: studentMarkOf(student.id) } } } },
        ],
      },
      include: cardTestInclude(student.id),
      orderBy: [{ year: 'asc' }, { month: 'asc' }, { id: 'asc' }],
    });

    return {
      tests,
      earlier: [],
      period,
      range: null,
      classTests: (classId) => ({ classId, testType: 'MONTHLY', isActive: true, deletedAt: null, ...inPeriod(period) }),
    };
  }

  // One class's session tests, in date order, from one test to another. A session is a class's
  // own year, so marks from another class's sessions don't follow the student here.
  private async sessionSource(
    studentId: number,
    query: Extract<IReportQuery, { mode: 'SESSION' }>,
    schoolYearStartDate: Date,
  ): Promise<ICardSource> {
    const ends = await prisma.test.findMany({
      where: {
        externalId: { in: [query.fromTestExternalId, query.toTestExternalId] },
        isActive: true,
        deletedAt: null,
      },
      select: { externalId: true, classId: true, testType: true, testDate: true, id: true },
    });

    const first = ends.find((test) => test.externalId === query.fromTestExternalId);
    const last = ends.find((test) => test.externalId === query.toTestExternalId);

    if (!first || !last) {
      throw ApiError.format('', ReportMessages.SESSION_TEST_NOT_FOUND);
    }

    if (
      first.testType !== 'SESSION' ||
      last.testType !== 'SESSION' ||
      first.classId !== last.classId ||
      !first.testDate ||
      !last.testDate
    ) {
      throw ApiError.format('', ReportMessages.SESSION_RANGE_INVALID);
    }

    // The school year the first test falls in, from the Settings start date's month
    const startMonth = schoolYearStartDate.getUTCMonth() + 1;
    const firstYear = first.testDate.getUTCFullYear();
    const startYear = first.testDate.getUTCMonth() + 1 >= startMonth ? firstYear : firstYear - 1;
    const yearStart = new Date(Date.UTC(startYear, startMonth - 1, 1));

    const sessionTests = await prisma.test.findMany({
      where: {
        classId: first.classId,
        testType: 'SESSION',
        isActive: true,
        deletedAt: null,
        testDate: { gte: yearStart, lte: last.testDate },
      },
      include: cardTestInclude(studentId),
      orderBy: [{ testDate: 'asc' }, { id: 'asc' }],
    });

    const firstAt = sessionTests.findIndex((test) => test.id === first.id);
    const lastAt = sessionTests.findIndex((test) => test.id === last.id);

    if (firstAt === -1 || lastAt === -1 || firstAt > lastAt) {
      throw ApiError.format('', ReportMessages.SESSION_RANGE_INVALID);
    }

    const tests = sessionTests.slice(firstAt, lastAt + 1);
    const earlier = query.earlierAsRow ? sessionTests.slice(0, firstAt) : [];
    const onCard = [...earlier, ...tests];
    const monthOf = (test: CardTest) => ({ month: test.month, year: test.year });

    return {
      tests,
      earlier,
      period: { from: monthOf(onCard[0]), to: monthOf(onCard[onCard.length - 1]) },
      range: { from: onCard[0].name, to: tests[tests.length - 1].name },
      classTests: () => ({ id: { in: onCard.map((test) => test.id) } }),
    };
  }

  private async buildRows(
    tests: CardTest[],
    student: CardStudent,
    subjectById: Map<number, { externalId: string; name: string }>,
    missingMarks: IReportCard['missingMarks'],
  ): Promise<{ rows: IReportCardRow[]; cardTests: CardTest[] }> {
    const rows: IReportCardRow[] = [];
    const cardTests: CardTest[] = [];

    for (const test of tests) {
      const marks: IReportCardRow['marks'] = {};
      let total = 0;
      let maxTotal = 0;
      const hasMarkOnTest = test.testSubjects.some((testSubject) => testSubject.scores.length > 0);

      for (const testSubject of test.testSubjects) {
        const { subject } = testSubject.subjectClass;
        const obtained = testSubject.scores[0]?.marksObtained ?? null;
        const expected =
          test.classId === student.classId &&
          student.takenSubjectIds.has(subject.id) &&
          owesTest(student.classSince, test, hasMarkOnTest);

        // No mark and none owed, such as an elective they don't do. No cell at all.
        if (obtained === null && !expected) {
          continue;
        }

        subjectById.set(subject.id, { externalId: subject.externalId, name: subject.name });
        marks[subject.externalId] = { obtained, max: testSubject.maxMarks };

        if (obtained === null) {
          missingMarks.push({ testName: test.name, subjectName: subject.name });
        } else {
          total += obtained;
          maxTotal += testSubject.maxMarks;
        }
      }

      if (Object.keys(marks).length === 0) {
        continue;
      }

      const percentage = maxTotal ? round2((total / maxTotal) * 100) : null;
      const grade = percentage === null ? null : (await GradeService.resolveGradeForPercentage(percentage)).grade;

      cardTests.push(test);
      rows.push({
        testExternalId: test.externalId,
        testName: test.name,
        month: test.month,
        year: test.year,
        testDate: isoDay(test.testDate),
        summary: false,
        marks,
        total,
        maxTotal,
        percentage,
        grade,
      });
    }

    return { rows, cardTests };
  }

  // Earlier tests as one row: each subject's entered marks out of those tests' max, like the
  // Subject Total row of the card they were first printed on.
  private async summaryRow(rows: IReportCardRow[]): Promise<IReportCardRow> {
    const marks: IReportCardRow['marks'] = {};

    for (const row of rows) {
      for (const [subjectId, cell] of Object.entries(row.marks)) {
        const sum = marks[subjectId] ?? { obtained: null, max: 0 };
        if (cell.obtained !== null) {
          sum.obtained = (sum.obtained ?? 0) + cell.obtained;
          sum.max += cell.max;
        } else if (sum.obtained === null) {
          // Nothing entered yet: shows blank, out of what's owed
          sum.max += cell.max;
        }
        marks[subjectId] = sum;
      }
    }

    const total = rows.reduce((sum, row) => sum + row.total, 0);
    const maxTotal = rows.reduce((sum, row) => sum + row.maxTotal, 0);
    const percentage = maxTotal ? round2((total / maxTotal) * 100) : null;
    const grade = percentage === null ? null : (await GradeService.resolveGradeForPercentage(percentage)).grade;
    const last = rows[rows.length - 1];
    const name = rows.length === 1 ? rows[0].testName : `${rows[0].testName} – ${last.testName}`;

    return {
      testExternalId: null,
      testName: name,
      month: last.month,
      year: last.year,
      testDate: last.testDate,
      summary: true,
      marks,
      total,
      maxTotal,
      percentage,
      grade,
    };
  }

  // Ranks everyone in the class at the end of the period by the same percentage each card
  // prints: marks entered, out of the max of those subjects, over the same tests.
  // A card spanning two classes has no fair group to rank against, so it gets no position.
  private async computePosition(
    studentId: number,
    source: ICardSource,
    cardTests: { classId: number }[],
  ): Promise<IReportCardPosition | null> {
    const classIds = new Set(cardTests.map((test) => test.classId));

    if (classIds.size !== 1) {
      return null;
    }

    const [classId] = classIds;
    const { period } = source;

    const testSubjects = await prisma.testSubject.findMany({
      where: { deletedAt: null, test: source.classTests(classId) },
      select: {
        maxMarks: true,
        test: { select: { id: true, month: true, year: true, testDate: true } },
        subjectClass: { select: { subjectId: true } },
        scores: {
          where: { deletedAt: null, student: { isActive: true, deletedAt: null } },
          select: {
            studentId: true,
            marksObtained: true,
            student: { select: { classId: true, classSince: true } },
          },
        },
      },
    });

    const classmates = await prisma.student.findMany({
      where: { classId, isActive: true, deletedAt: null },
      select: {
        id: true,
        classSince: true,
        studentSubjects: { select: { subjectClass: { select: { subjectId: true } } } },
      },
    });

    const totals = new Map<number, { obtained: number; max: number }>();
    const markedOnTest = new Set<string>();

    for (const testSubject of testSubjects) {
      for (const score of testSubject.scores) {
        markedOnTest.add(`${score.studentId}:${testSubject.test.id}`);

        if (inClassAtPeriodEnd(score.student, classId, period)) {
          const total = totals.get(score.studentId) ?? { obtained: 0, max: 0 };
          total.obtained += score.marksObtained;
          total.max += testSubject.maxMarks;
          totals.set(score.studentId, total);
        }
      }
    }

    if (totals.size <= 1 || !totals.has(studentId)) {
      return null;
    }

    const percentages = Array.from(totals.values(), ({ obtained, max }) => round2((obtained / max) * 100));
    const own = totals.get(studentId)!;
    const ownPercentage = round2((own.obtained / own.max) * 100);

    const provisional = classmates.some((classmate) => {
      const taken = new Set(classmate.studentSubjects.map((ss) => ss.subjectClass.subjectId));
      return testSubjects.some(
        ({ test, subjectClass, scores }) =>
          taken.has(subjectClass.subjectId) &&
          owesTest(classmate.classSince, test, markedOnTest.has(`${classmate.id}:${test.id}`)) &&
          !scores.some((score) => score.studentId === classmate.id),
      );
    });

    return {
      rank: new Set(percentages.filter((percentage) => percentage > ownPercentage)).size + 1,
      outOf: totals.size,
      provisional,
    };
  }
}

export default new ReportService();
