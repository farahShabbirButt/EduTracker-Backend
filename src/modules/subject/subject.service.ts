import { SubjectType } from '@prisma/client';
import prisma, { LIVE_SCORES, rethrowUniqueViolation } from '../../lib/prisma.js';
import { StudentSubjectService } from '../../modules/studentSubject/index.js';
import { ApiError } from '../../common/responses/index.js';
import {
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
}

export default new SubjectService();
