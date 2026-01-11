import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { createSubjectMapper, ICreateSubject, IUpdateSubject, SubjectMessages } from './index.js';

class SubjectService {
  async createSubject(payload: ICreateSubject): Promise<IAPISuccessResponse> {
    try {
      //Check for existing active subject with same name
      const existingSubject = await prisma.subject.findFirst({
        where: {
          name: payload.name,
          isActive: true,
        },
      });
      if (existingSubject) {
        throw ApiError.format('', SubjectMessages.SUBJECT_ALREADY_EXISTS);
      }
      const subjectData = createSubjectMapper(payload);
      const createdSubject = await prisma.subject.create({
        data: subjectData,
      });

      return {
        keyName: 'subject',
        subject: createdSubject,
        code: SubjectMessages.SUBJECT_CREATED_SUCCESSFULLY.code,
        message: SubjectMessages.SUBJECT_CREATED_SUCCESSFULLY.message,
        success: true,
      };
    } catch (error) {
      throw ApiError.format(error, SubjectMessages.SUBJECT_CREATION_FAILURE);
    }
  }

  // async getAllSubjects(): Promise<IAPISuccessResponse> {
  //   try {
  //     const subjects = await prisma.subject.findMany({
  //       where: {
  //         isActive: true,
  //         deletedAt: null,
  //       },
  //       orderBy: {
  //         createdAt: 'desc',
  //       },
  //     });

  //     return {
  //       keyName: 'subjects',
  //       subjects,
  //       code: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.code,
  //       message: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.message,
  //     };
  //   } catch (error) {
  //     throw ApiError.format(error, SubjectMessages.SUBJECTS_LIST_FETCHING_FAILURE);
  //   }
  // }
  async getAllSubjects(): Promise<IAPISuccessResponse> {
    try {
      const subjects = await prisma.subject.findMany({
        where: {
          isActive: true,
          deletedAt: null,
        },
        include: {
          subjectClasses: {
            where: {
              deletedAt: null,
              class: {
                isActive: true,
                deletedAt: null,
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      // optional: flatten response
      const formattedSubjects = subjects.map((subject) => ({
        ...subject,
        classes: subject.subjectClasses.map((sc) => sc.class),
        subjectClasses: undefined,
      }));

      return {
        keyName: 'subjects',
        subjects: formattedSubjects,
        code: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.code,
        message: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.message,
      };
    } catch (error) {
      throw ApiError.format(error, SubjectMessages.SUBJECTS_LIST_FETCHING_FAILURE);
    }
  }

  async getSubjectById(externalId: string): Promise<IAPISuccessResponse> {
    try {
      const subject = await prisma.subject.findFirst({
        where: {
          externalId,
          deletedAt: null,
        },
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
    } catch (error) {
      throw ApiError.format(error, SubjectMessages.SUBJECT_FETCH_FAILURE);
    }
  }

  async updateSubject(externalId: string, payload: IUpdateSubject): Promise<IAPISuccessResponse> {
    try {
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
            isActive: true,
            externalId: { not: externalId },
          },
        });

        if (duplicate) {
          throw ApiError.format(null, SubjectMessages.SUBJECT_ALREADY_EXISTS);
        }
      }

      const updatedSubject = await prisma.subject.update({
        where: { id: subject.id },
        data: {
          ...payload,
          updatedBy: payload.updatedBy ?? null,
        },
      });

      return {
        keyName: 'subject',
        subject: updatedSubject,
        code: SubjectMessages.SUBJECT_UPDATED_SUCCESSFULLY.code,
        message: SubjectMessages.SUBJECT_UPDATED_SUCCESSFULLY.message,
      };
    } catch (error) {
      throw ApiError.format(error, SubjectMessages.SUBJECT_UPDATE_FAILURE);
    }
  }
  async deleteSubject(externalId: string): Promise<IAPISuccessResponse> {
    try {
      const subject = await prisma.subject.findFirst({
        where: {
          externalId,
          deletedAt: null,
        },
      });

      if (!subject) {
        throw ApiError.format(null, SubjectMessages.SUBJECT_NOT_FOUND);
      }
      //Soft delete
      await prisma.subject.update({
        where: { id: subject.id },
        data: {
          isActive: false,
          deletedAt: new Date(),
        },
      });

      return {
        keyName: 'result',
        result: true,
        code: SubjectMessages.SUBJECT_DELETED_SUCCESSFULLY.code,
        message: SubjectMessages.SUBJECT_DELETED_SUCCESSFULLY.message,
      };
    } catch (error) {
      throw ApiError.format(error, SubjectMessages.SUBJECT_DELETED_FAILURE);
    }
  }
}

export default new SubjectService();
