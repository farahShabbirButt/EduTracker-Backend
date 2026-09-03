import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ClassMessages, createClassMapper, ICreateClass, IUpdateClass } from './index.js';
import { SubjectMessages } from '../../modules/subject/index.js';

class ClassService {
  async createClass(payload: ICreateClass): Promise<IAPISuccessResponse> {
    // Check for existing active class with same name
    const existingClass = await prisma.class.findFirst({
      where: {
        name: payload.name,
        isActive: true,
        deletedAt: null,
      },
    });

    if (existingClass) {
      throw ApiError.format('', ClassMessages.CLASS_ALREADY_EXISTS);
    }

    const classData = createClassMapper(payload);
    const createdClass = await prisma.class.create({
      data: classData,
    });

    return {
      keyName: 'class',
      class: createdClass,
      code: ClassMessages.CLASS_CREATED_SUCCESSFULLY.code,
      message: ClassMessages.CLASS_CREATED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getAllClasses(): Promise<IAPISuccessResponse> {
    const classes = await prisma.class.findMany({
      where: {
        isActive: true,
        deletedAt: null,
      },
      include: {
        subjectClasses: {
          where: { deletedAt: null },
        },
        students: {
          where: { deletedAt: null, isActive: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      keyName: 'classes',
      classes,
      code: ClassMessages.CLASSES_LIST_FETCHED_SUCCESSFULLY.code,
      message: ClassMessages.CLASSES_LIST_FETCHED_SUCCESSFULLY.message,
    };
  }

  async getClassById(externalId: string): Promise<IAPISuccessResponse> {
    const classItem = await prisma.class.findFirst({
      where: { externalId, deletedAt: null },
      include: {
        subjectClasses: { where: { deletedAt: null } },
        students: { where: { deletedAt: null, isActive: true } },
      },
    });

    if (!classItem) {
      throw ApiError.format(null, ClassMessages.CLASS_NOT_FOUND);
    }

    return {
      keyName: 'class',
      class: classItem,
      code: ClassMessages.CLASS_FETCHED_SUCCESSFULLY.code,
      message: ClassMessages.CLASS_FETCHED_SUCCESSFULLY.message,
    };
  }

  async updateClass(externalId: string, payload: IUpdateClass): Promise<IAPISuccessResponse> {
    const classItem = await prisma.class.findFirst({
      where: { externalId, deletedAt: null },
    });

    if (!classItem) {
      throw ApiError.format(null, ClassMessages.CLASS_NOT_FOUND);
    }

    if (payload?.name) {
      const duplicate = await prisma.class.findFirst({
        where: {
          name: payload.name,
          isActive: true,
          deletedAt: null,
          externalId: { not: externalId },
        },
      });

      if (duplicate) {
        throw ApiError.format(null, ClassMessages.CLASS_ALREADY_EXISTS);
      }
    }

    const updatedClass = await prisma.class.update({
      where: { id: classItem.id },
      data: { ...payload, updatedBy: payload.updatedBy ?? null },
    });

    return {
      keyName: 'class',
      class: updatedClass,
      code: ClassMessages.CLASS_UPDATED_SUCCESSFULLY.code,
      message: ClassMessages.CLASS_UPDATED_SUCCESSFULLY.message,
    };
  }

  async deleteClass(externalId: string): Promise<IAPISuccessResponse> {
    const classItem = await prisma.class.findFirst({
      where: { externalId, deletedAt: null },
    });

    if (!classItem) {
      throw ApiError.format(null, ClassMessages.CLASS_NOT_FOUND);
    }

    // Soft delete
    await prisma.class.update({
      where: { id: classItem.id },
      data: { isActive: false, deletedAt: new Date() },
    });

    return {
      keyName: 'result',
      result: true,
      code: ClassMessages.CLASS_DELETED_SUCCESSFULLY.code,
      message: ClassMessages.CLASS_DELETED_SUCCESSFULLY.message,
    };
  }
  async getSubjectsByClass(classExternalId: string): Promise<IAPISuccessResponse> {
    const classEntity = await prisma.class.findFirst({
      where: {
        externalId: classExternalId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!classEntity) {
      throw ApiError.format(null, ClassMessages.CLASS_NOT_FOUND);
    }

    const subjects = await prisma.subjectClass.findMany({
      where: {
        classId: classEntity.id,
        deletedAt: null,
        subject: {
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        subject: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      keyName: 'subjects',
      subjects: subjects.map((sc) => sc.subject),
      code: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.code,
      message: SubjectMessages.SUBJECTS_LIST_FETCHED_SUCCESSFULLY.message,
    };
  }
}

export default new ClassService();
