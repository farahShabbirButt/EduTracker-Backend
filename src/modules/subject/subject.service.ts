import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { createSubjectMapper, ICreateSubject, SubjectMessages } from './index.js';

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

  // you can add more methods later:
  // findAll, findById, update, delete, etc.
}

export default new SubjectService();
