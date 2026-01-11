import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { SubjectClassMessages, ICreateSubjectClass } from './index.js';

class SubjectClassService {
  async assignSubjectsToClass(payload: ICreateSubjectClass): Promise<IAPISuccessResponse> {
    try {
      return await prisma.$transaction(async (tx) => {
        // Resolve Class
        const classEntity = await tx.class.findFirst({
          where: {
            externalId: payload.classId,
            isActive: true,
            deletedAt: null,
          },
        });

        if (!classEntity) {
          throw ApiError.format(null, SubjectClassMessages.CLASS_NOT_FOUND);
        }

        // Resolve Subjects
        const subjects = await tx.subject.findMany({
          where: {
            externalId: { in: payload.subjectIds },
            isActive: true,
            deletedAt: null,
          },
          select: { id: true, externalId: true },
        });

        if (subjects.length !== payload.subjectIds.length) {
          throw ApiError.format(null, SubjectClassMessages.SUBJECT_NOT_FOUND);
        }

        const incomingSubjectIds = subjects.map((s) => s.id);

        // Fetch existing mappings
        const existingMappings = await tx.subjectClass.findMany({
          where: {
            classId: classEntity.id,
            deletedAt: null,
          },
        });

        const existingSubjectIds = existingMappings.map((m) => m.subjectId);

        // Subjects to REMOVE
        const toRemove = existingMappings.filter((m) => !incomingSubjectIds.includes(m.subjectId));

        // Subjects to ADD
        const toAdd = incomingSubjectIds.filter((id) => !existingSubjectIds.includes(id));

        // Soft delete removed mappings
        if (toRemove.length > 0) {
          await tx.subjectClass.updateMany({
            where: {
              id: { in: toRemove.map((m) => m.id) },
            },
            data: {
              deletedAt: new Date(),
              updatedBy: payload.createdBy ?? null,
            },
          });
        }

        // Create new mappings
        if (toAdd.length > 0) {
          await tx.subjectClass.createMany({
            data: toAdd.map((subjectId) => ({
              classId: classEntity.id,
              subjectId,
              createdBy: payload.createdBy ?? null,
            })),
          });
        }

        return {
          keyName: 'result',
          result: true,
          code: SubjectClassMessages.SUBJECTS_ASSIGNED_SUCCESSFULLY.code,
          message: SubjectClassMessages.SUBJECTS_ASSIGNED_SUCCESSFULLY.message,
        };
      });
    } catch (error) {
      throw ApiError.format(error, SubjectClassMessages.SUBJECT_ASSIGNMENT_FAILED);
    }
  }
}

export default new SubjectClassService();
