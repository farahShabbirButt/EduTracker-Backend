import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ConductMessages, IUpsertConduct } from './index.js';

class ConductService {
  async upsertConduct(studentExternalId: string, payload: IUpsertConduct): Promise<IAPISuccessResponse> {
    const student = await prisma.student.findFirst({
      where: { externalId: studentExternalId, isActive: true, deletedAt: null },
    });

    if (!student) {
      throw ApiError.format('', ConductMessages.STUDENT_NOT_FOUND);
    }

    const { month, year, behaviour, uniformCleanliness, createdBy, updatedBy } = payload;

    const conduct = await prisma.studentConduct.upsert({
      where: { studentId_month_year: { studentId: student.id, month, year } },
      create: { studentId: student.id, month, year, behaviour, uniformCleanliness, createdBy },
      update: { behaviour, uniformCleanliness, updatedBy },
    });

    return {
      keyName: 'conduct',
      conduct,
      code: ConductMessages.CONDUCT_UPSERTED_SUCCESSFULLY.code,
      message: ConductMessages.CONDUCT_UPSERTED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getConduct(studentExternalId: string, month: number, year: number): Promise<IAPISuccessResponse> {
    const student = await prisma.student.findFirst({
      where: { externalId: studentExternalId, isActive: true, deletedAt: null },
    });

    if (!student) {
      throw ApiError.format('', ConductMessages.STUDENT_NOT_FOUND);
    }

    const conduct = await prisma.studentConduct.findFirst({
      where: { studentId: student.id, month, year, deletedAt: null },
    });

    return {
      keyName: 'conduct',
      conduct: conduct ?? null,
      code: ConductMessages.CONDUCT_FETCHED_SUCCESSFULLY.code,
      message: ConductMessages.CONDUCT_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }
}

export default new ConductService();
