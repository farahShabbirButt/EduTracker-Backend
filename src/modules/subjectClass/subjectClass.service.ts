import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { SubjectClassMessages, ICreateSubjectClass } from './index.js';
import { SubjectMessages } from '../../modules/subject/index.js';
import { ClassMessages } from '../../modules/class/index.js';
import { StudentSubjectService } from '../../modules/studentSubject/index.js';

class SubjectClassService {
  async assignSubjectsToClass(payload: ICreateSubjectClass): Promise<IAPISuccessResponse> {
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
        throw ApiError.format(null, ClassMessages.CLASS_NOT_FOUND);
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
        throw ApiError.format(null, SubjectMessages.SUBJECT_NOT_FOUND);
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

      // A subject assigned here before gets its old link back, with its tests and enrolments
      const removedLinks = await tx.subjectClass.findMany({
        where: { classId: classEntity.id, subjectId: { in: toAdd }, deletedAt: { not: null } },
        orderBy: { id: 'asc' },
      });
      const linkToRestore = new Map(removedLinks.map((link) => [link.subjectId, link.id]));

      if (linkToRestore.size > 0) {
        await tx.subjectClass.updateMany({
          where: { id: { in: [...linkToRestore.values()] } },
          data: { deletedAt: null, updatedBy: payload.createdBy ?? null },
        });
      }

      // Create new mappings
      const toCreate = toAdd.filter((subjectId) => !linkToRestore.has(subjectId));
      if (toCreate.length > 0) {
        await tx.subjectClass.createMany({
          data: toCreate.map((subjectId) => ({
            classId: classEntity.id,
            subjectId,
            createdBy: payload.createdBy ?? null,
          })),
        });
      }

      await StudentSubjectService.enrolClassInCompulsorySubjects(classEntity.id, tx);

      return {
        keyName: 'result',
        result: true,
        code: SubjectClassMessages.SUBJECTS_ASSIGNED_SUCCESSFULLY.code,
        message: SubjectClassMessages.SUBJECTS_ASSIGNED_SUCCESSFULLY.message,
      };
    });
  }
}

export default new SubjectClassService();
