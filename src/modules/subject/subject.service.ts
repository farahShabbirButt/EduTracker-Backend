import { SubjectType } from '@prisma/client';
import prisma, { LIVE_SCORES, rethrowUniqueViolation } from '../../lib/prisma.js';
import { StudentSubjectService } from '../../modules/studentSubject/index.js';
import { ApiError } from '../../common/responses/index.js';
import { SubjectClassService } from '../../modules/subjectClass/index.js';
import {
  cleanText,
  countRows,
  IImportResult,
  IImportRowResult,
  nameKey,
  plural,
  refuseProblems,
} from '../../lib/import.js';
import { MAX_MARKS_LIMIT } from './subject.validation.js';
import {
  IImportSubjects,
  createSubjectMapper,
  ICreateSubject,
  IGetAllSubjectsQuery,
  IUpdateSubject,
  SUBJECT_PUBLIC_FIELDS,
  SubjectMessages,
} from './index.js';

class SubjectService {
  async createSubject(payload: ICreateSubject): Promise<IAPISuccessResponse> {
    //Check for existing active subject with same name
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: payload.name,
        isActive: true,
        deletedAt: null,
      },
    });
    if (existingSubject) {
      throw ApiError.format('', SubjectMessages.SUBJECT_ALREADY_EXISTS);
    }
    const subjectData = createSubjectMapper(payload);
    const createdSubject = await prisma.subject
      .create({
        data: subjectData,
        select: SUBJECT_PUBLIC_FIELDS,
      })
      .catch(rethrowUniqueViolation(SubjectMessages.SUBJECT_ALREADY_EXISTS));

    return {
      keyName: 'subject',
      subject: createdSubject,
      code: SubjectMessages.SUBJECT_CREATED_SUCCESSFULLY.code,
      message: SubjectMessages.SUBJECT_CREATED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getAllSubjects(query: IGetAllSubjectsQuery): Promise<IAPISuccessResponse> {
    const { classExternalId } = query;

    let classId = null;

    if (classExternalId) {
      const classData = await prisma.class.findUnique({
        where: { externalId: classExternalId, isActive: true, deletedAt: null },
      });

      if (!classData) {
        throw ApiError.format('', SubjectMessages.CLASS_NOT_FOUND);
      }

      classId = classData.id;
    }
    const subjects = await prisma.subject.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        ...(classId && { subjectClasses: { some: { classId, deletedAt: null } } }),
      },
      select: {
        ...SUBJECT_PUBLIC_FIELDS,
        subjectClasses: {
          where: {
            deletedAt: null,
            class: {
              isActive: true,
              deletedAt: null,
              ...(classId && { id: classId }),
            },
          },
          select: {
            class: {
              select: {
                externalId: true,
                name: true,
              },
            },
          },
        },
      },
      // id breaks ties between rows created in the same instant
      orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
    });

    // optional: flatten response
    const formattedSubjects = subjects.map(({ subjectClasses, ...subject }) => ({
      ...subject,
      classes: subjectClasses.map((sc) => sc.class),
    }));

    return {
      keyName: 'subjects',
      subjects: formattedSubjects,
      code: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.code,
      message: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.message,
    };
  }

  async getSubjectById(externalId: string): Promise<IAPISuccessResponse> {
    const subject = await prisma.subject.findFirst({
      where: {
        externalId,
        deletedAt: null,
      },
      select: SUBJECT_PUBLIC_FIELDS,
    });

    if (!subject) {
      throw ApiError.format(null, SubjectMessages.SUBJECT_NOT_FOUND);
    }

    return {
      keyName: 'subject',
      subject,
      code: SubjectMessages.SUBJECT_FETCHED_SUCCESSFULLY.code,
      message: SubjectMessages.SUBJECT_FETCHED_SUCCESSFULLY.message,
    };
  }

  async updateSubject(externalId: string, payload: IUpdateSubject): Promise<IAPISuccessResponse> {
    const subject = await prisma.subject.findFirst({
      where: {
        externalId,
        deletedAt: null,
      },
    });

    if (!subject) {
      throw ApiError.format(null, SubjectMessages.SUBJECT_NOT_FOUND);
    }

    // Prevent duplicate active subject names
    if (payload?.name) {
      const duplicate = await prisma.subject.findFirst({
        where: {
          name: payload.name,
          deletedAt: null,
          externalId: { not: externalId },
        },
      });

      if (duplicate) {
        throw ApiError.format(null, SubjectMessages.SUBJECT_ALREADY_EXISTS);
      }
    }

    const becomingCompulsory =
      payload.subjectType === SubjectType.COMPULSORY && subject.subjectType !== SubjectType.COMPULSORY;

    // Everyone in the class would owe its past tests, and cards would fill with blanks
    if (becomingCompulsory) {
      const testCount = await prisma.testSubject.count({
        where: {
          deletedAt: null,
          test: { isActive: true, deletedAt: null },
          subjectClass: { subjectId: subject.id },
        },
      });

      if (testCount > 0) {
        throw ApiError.format(null, SubjectMessages.SUBJECT_ON_TESTS);
      }
    }

    const updatedSubject = await prisma.$transaction(async (tx) => {
      const updated = await tx.subject
        .update({
          where: { id: subject.id },
          data: {
            ...payload,
            updatedBy: payload.updatedBy ?? null,
          },
          select: SUBJECT_PUBLIC_FIELDS,
        })
        .catch(rethrowUniqueViolation(SubjectMessages.SUBJECT_ALREADY_EXISTS));

      // Now compulsory, so every student in its classes takes it
      if (becomingCompulsory) {
        const links = await tx.subjectClass.findMany({
          where: { subjectId: subject.id, deletedAt: null },
          select: { classId: true },
        });

        for (const { classId } of links) {
          await StudentSubjectService.enrolClassInCompulsorySubjects(classId, tx);
        }
      }

      return updated;
    });

    return {
      keyName: 'subject',
      subject: updatedSubject,
      code: SubjectMessages.SUBJECT_UPDATED_SUCCESSFULLY.code,
      message: SubjectMessages.SUBJECT_UPDATED_SUCCESSFULLY.message,
    };
  }
  async deleteSubject(externalId: string): Promise<IAPISuccessResponse> {
    const subject = await prisma.subject.findFirst({
      where: {
        externalId,
        deletedAt: null,
      },
    });

    if (!subject) {
      throw ApiError.format(null, SubjectMessages.SUBJECT_NOT_FOUND);
    }
    // Marks would stay on cards but couldn't be fixed, and a new subject of the same name
    // would print as a second column
    const markCount = await prisma.studentScore.count({
      where: {
        ...LIVE_SCORES,
        testSubject: {
          deletedAt: null,
          test: { isActive: true, deletedAt: null },
          subjectClass: { subjectId: subject.id },
        },
      },
    });

    if (markCount > 0) {
      throw ApiError.format(null, SubjectMessages.SUBJECT_HAS_MARKS);
    }

    // Comes off its tests too, or every card would show a column no mark can fill
    await prisma.$transaction(async (tx) => {
      const deletedAt = new Date();
      const testSubjects = await tx.testSubject.findMany({
        where: { deletedAt: null, subjectClass: { subjectId: subject.id } },
        select: { id: true, testId: true, maxMarks: true },
      });

      await tx.testSubject.updateMany({ where: { id: { in: testSubjects.map((ts) => ts.id) } }, data: { deletedAt } });

      for (const { testId, maxMarks } of testSubjects) {
        await tx.test.update({ where: { id: testId }, data: { totalMarks: { decrement: maxMarks } } });
      }

      await tx.subject.update({
        where: { id: subject.id },
        data: {
          isActive: false,
          deletedAt,
        },
      });
    });

    return {
      keyName: 'result',
      result: true,
      code: SubjectMessages.SUBJECT_DELETED_SUCCESSFULLY.code,
      message: SubjectMessages.SUBJECT_DELETED_SUCCESSFULLY.message,
    };
  }
  // One row per subject, its classes in one cell separated by commas. A subject already in the
  // app keeps its type and max marks; the import can still offer it in more classes.
  async importSubjects({ dryRun, rows, createdBy }: IImportSubjects): Promise<IAPISuccessResponse> {
    const [subjects, classes] = await Promise.all([
      prisma.subject.findMany({
        where: { deletedAt: null },
        select: {
          id: true,
          name: true,
          isActive: true,
          subjectType: true,
          maxMarks: true,
          subjectClasses: { where: { deletedAt: null }, select: { classId: true } },
        },
      }),
      prisma.class.findMany({ where: { isActive: true, deletedAt: null }, select: { id: true, name: true } }),
    ]);
    const subjectByKey = new Map(subjects.map((s) => [nameKey(s.name), s]));
    const classByKey = new Map(classes.map((c) => [nameKey(c.name), c]));
    // Names that differ only in case can both exist; the import can't tell which one is meant
    const twice = (names: string[]) => {
      const keys = names.map(nameKey);
      return new Set(keys.filter((k, i) => keys.indexOf(k) !== i));
    };
    const subjectTwice = twice(subjects.map((s) => s.name));
    const classTwice = twice(classes.map((c) => c.name));
    const seen = new Map<string, number>();

    // What saving does, per new row: create the subject and/or offer it in these classes
    const plans: { row: number; subjectId?: number; create?: ICreateSubject; classIds: number[] }[] = [];

    const results: IImportRowResult[] = rows.map((input) => {
      const name = cleanText(input.name);
      const key = nameKey(name);
      const problems: string[] = [];
      const notes: string[] = [];
      const done = (status: IImportRowResult['status'], messages: string[]): IImportRowResult => ({
        row: input.row,
        label: name,
        status,
        messages,
      });

      if (!name) problems.push('The subject name is missing');
      else if (name.length < 2) problems.push('The subject name must be at least 2 characters');
      else if (name.length > 100) problems.push('The subject name must be less than 100 characters');
      if (key && seen.has(key)) {
        problems.push(`${name} is also on row ${seen.get(key)}. Put all its classes on one row, separated by commas`);
      }
      if (key && !seen.has(key)) seen.set(key, input.row);

      const typeText = nameKey(input.subjectType);
      const subjectType = ['compulsory', 'c', 'core', 'required'].includes(typeText)
        ? SubjectType.COMPULSORY
        : ['elective', 'e', 'optional'].includes(typeText)
          ? SubjectType.ELECTIVE
          : null;
      if (typeText && !subjectType) problems.push('Type must be Compulsory or Elective');

      const marksText = cleanText(input.maxMarks);
      const maxMarks = /^\d+$/.test(marksText) ? Number(marksText) : null;
      if (marksText && (maxMarks === null || maxMarks < 1 || maxMarks > MAX_MARKS_LIMIT)) {
        problems.push(`Max marks must be a whole number from 1 to ${MAX_MARKS_LIMIT}`);
      }

      const classIds: number[] = [];
      const classNames = [
        ...new Map(
          cleanText(input.classes)
            .split(/[,;]/)
            .map((c) => cleanText(c))
            .filter(Boolean)
            .map((c) => [nameKey(c), c]),
        ).values(),
      ];
      for (const className of classNames) {
        const found = classByKey.get(nameKey(className));
        if (classTwice.has(nameKey(className))) {
          problems.push(`More than one class is called ${className} (different capitals). Rename one first`);
        } else if (!found) problems.push(`There is no class called ${className}`);
        else if (!classIds.includes(found.id)) classIds.push(found.id);
      }

      const existing = subjectByKey.get(key);
      if (!existing) {
        if (!typeText) problems.push('Type is missing. Use Compulsory or Elective');
        if (!marksText) problems.push('Max marks is missing');
        if (problems.length) return done('problem', problems);
        plans.push({
          row: input.row,
          create: { name, subjectType: subjectType!, maxMarks: maxMarks!, createdBy },
          classIds,
        });
        return done('new', classIds.length ? [`Offered in ${classNamesOf(classIds)}`] : []);
      }

      if (subjectTwice.has(key)) {
        problems.push(`More than one subject is called ${name} (different capitals). Rename one first`);
      } else if (!existing.isActive) {
        problems.push(`${existing.name} is switched off in the app, so it can't be offered in classes`);
      }
      if (problems.length) return done('problem', problems);

      if ((subjectType && subjectType !== existing.subjectType) || (maxMarks && maxMarks !== existing.maxMarks)) {
        notes.push(
          `Already there as ${existing.subjectType === SubjectType.COMPULSORY ? 'Compulsory' : 'Elective'}, out of ${existing.maxMarks}. That stays as it is`,
        );
      }
      const offered = new Set(existing.subjectClasses.map((l) => l.classId));
      const adding = classIds.filter((id) => !offered.has(id));
      if (adding.length === 0) {
        return done('exists', [
          `${existing.name} is already there${classIds.length ? ' in those classes' : ''}, so it is skipped`,
          ...notes,
        ]);
      }
      plans.push({ row: input.row, subjectId: existing.id, classIds: adding });
      return done('new', [
        `${existing.name} is already there. It will also be offered in ${classNamesOf(adding)}`,
        ...notes,
      ]);
    });

    function classNamesOf(ids: number[]) {
      return ids.map((id) => classes.find((c) => c.id === id)!.name).join(', ');
    }

    const answer: IImportResult = { dryRun, counts: countRows(results), rows: results };
    if (dryRun) {
      return { keyName: 'subjectImport', subjectImport: answer, ...SubjectMessages.SUBJECT_IMPORT_CHECKED };
    }

    refuseProblems(results, SubjectMessages.SUBJECT_IMPORT_HAS_PROBLEMS);

    const created = await prisma
      .$transaction(
        async (tx) => {
          const made = [];
          const byClass = new Map<number, number[]>();
          for (const plan of plans) {
            let subjectId = plan.subjectId;
            if (plan.create) {
              const subject = await tx.subject.create({
                data: createSubjectMapper(plan.create),
                select: { ...SUBJECT_PUBLIC_FIELDS, id: true },
              });
              const { id, ...shown } = subject;
              subjectId = id;
              made.push(shown);
            }
            for (const classId of plan.classIds) byClass.set(classId, [...(byClass.get(classId) ?? []), subjectId!]);
          }
          for (const [classId, subjectIds] of byClass) {
            await SubjectClassService.linkSubjects(tx, classId, subjectIds, createdBy);
            await StudentSubjectService.enrolClassInCompulsorySubjects(classId, tx);
          }
          return made;
        },
        { timeout: 30_000 },
      )
      .catch(rethrowUniqueViolation(SubjectMessages.SUBJECT_ALREADY_EXISTS));

    answer.created = created;
    const added = plans.length - created.length;
    const parts = [
      created.length ? `${plural(created.length, 'subject', 'subjects')} added` : '',
      added ? `${plural(added, 'subject', 'subjects')} offered in more classes` : '',
      answer.counts.exists ? `${answer.counts.exists} already there` : '',
    ].filter(Boolean);
    return {
      keyName: 'subjectImport',
      subjectImport: answer,
      code: SubjectMessages.SUBJECT_IMPORT_DONE.code,
      message: parts.join(', '),
      success: true,
    };
  }
}

export default new SubjectService();
