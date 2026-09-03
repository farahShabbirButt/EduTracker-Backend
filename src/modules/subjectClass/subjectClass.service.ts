import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { SubjectClassMessages, ICreateSubjectClass } from './index.js';
import { SubjectMessages } from '../../modules/subject/index.js';
import { ClassMessages } from '../../modules/class/index.js';
import { SubjectType } from '@prisma/client';

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
  }

  //dont delete all assignments
  async assignSubjectsToClass2(payload: ICreateSubjectClass): Promise<IAPISuccessResponse> {
    return await prisma.$transaction(async (tx) => {
      // 1) Resolve Class
      const classEntity = await tx.class.findFirst({
        where: {
          externalId: payload.classId,
          isActive: true,
          deletedAt: null,
        },
        select: { id: true },
      });

      if (!classEntity) {
        throw ApiError.format(null, ClassMessages.CLASS_NOT_FOUND);
      }

      // 2) Resolve SUBJECTS from payload, but only ELECTIVE (ignore compulsory)
      //    NOTE: adjust field name if yours is different (subjectType, type, etc.)
      const incomingSubjects = await tx.subject.findMany({
        where: {
          externalId: { in: payload.subjectIds },
          isActive: true,
          deletedAt: null,
          subjectType: SubjectType.ELECTIVE, // <-- key change
        },
        select: { id: true, externalId: true },
      });

      // Optional strictness:
      // If user sent some ids that are compulsory or invalid,
      // decide whether to fail or ignore.
      // Here: fail only if NONE are found but payload had ids, or if you want exact match for electives.
      //
      // If you want to ignore compulsory quietly, DON'T compare lengths.
      // If you want to error when they send non-elective ids, do extra checks.
      //
      // I’ll do "ignore compulsory silently":
      const incomingElectiveIds = incomingSubjects.map((s) => s.id);

      // 3) Fetch existing ACTIVE mappings for this class (not deleted)
      const existingMappings = await tx.subjectClass.findMany({
        where: {
          classId: classEntity.id,
          deletedAt: null,
        },
        select: { id: true, subjectId: true },
      });

      const existingSubjectIds = existingMappings.map((m) => m.subjectId);

      // 4) Compute removals & adds (set logic)
      // Remove: existing - incoming
      const mappingIdsToSoftDelete = existingMappings
        .filter((m) => !incomingElectiveIds.includes(m.subjectId))
        .map((m) => m.id);

      // Add: incoming - existing
      const subjectIdsToAdd = incomingElectiveIds.filter((id) => !existingSubjectIds.includes(id));

      // 5) Soft delete only missing ones
      if (mappingIdsToSoftDelete.length > 0) {
        await tx.subjectClass.updateMany({
          where: { id: { in: mappingIdsToSoftDelete } },
          data: {
            deletedAt: new Date(),
            updatedBy: payload.createdBy ?? null,
          },
        });
      }

      // 6) Create only new ones
      if (subjectIdsToAdd.length > 0) {
        await tx.subjectClass.createMany({
          data: subjectIdsToAdd.map((subjectId) => ({
            classId: classEntity.id,
            subjectId,
            createdBy: payload.createdBy ?? null,
          })),
          // optional safety if you have a unique constraint:
          // skipDuplicates: true,
        });
      }

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
