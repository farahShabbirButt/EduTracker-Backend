import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { GradeMessages, createGradeScaleMapper, ICreateGradeScale, IUpdateGradeScale } from './index.js';

class GradeService {
  async assertNoOverlap(minPercentage: number, maxPercentage: number, excludeId?: number): Promise<void> {
    const overlapping = await prisma.gradeScale.findFirst({
      where: {
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
        minPercentage: { lte: maxPercentage },
        maxPercentage: { gte: minPercentage },
      },
    });

    if (overlapping) {
      throw ApiError.format('', GradeMessages.GRADE_SCALE_OVERLAPS);
    }
  }

  async createGradeScale(payload: ICreateGradeScale): Promise<IAPISuccessResponse> {
    await this.assertNoOverlap(payload.minPercentage, payload.maxPercentage);

    const gradeScaleData = createGradeScaleMapper(payload);
    const createdGradeScale = await prisma.gradeScale.create({
      data: gradeScaleData,
    });

    return {
      keyName: 'gradeScale',
      gradeScale: createdGradeScale,
      code: GradeMessages.GRADE_SCALE_CREATED_SUCCESSFULLY.code,
      message: GradeMessages.GRADE_SCALE_CREATED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getAllGradeScales(): Promise<IAPISuccessResponse> {
    const gradeScales = await prisma.gradeScale.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { minPercentage: 'desc' },
    });

    return {
      keyName: 'gradeScales',
      gradeScales,
      code: GradeMessages.GRADE_SCALES_FETCHED_SUCCESSFULLY.code,
      message: GradeMessages.GRADE_SCALES_FETCHED_SUCCESSFULLY.message,
    };
  }

  async getGradeScaleById(externalId: string): Promise<IAPISuccessResponse> {
    const gradeScale = await prisma.gradeScale.findFirst({
      where: { externalId, deletedAt: null },
    });

    if (!gradeScale) {
      throw ApiError.format(null, GradeMessages.GRADE_SCALE_NOT_FOUND);
    }

    return {
      keyName: 'gradeScale',
      gradeScale,
      code: GradeMessages.GRADE_SCALE_FETCHED_SUCCESSFULLY.code,
      message: GradeMessages.GRADE_SCALE_FETCHED_SUCCESSFULLY.message,
    };
  }

  async updateGradeScale(externalId: string, payload: IUpdateGradeScale): Promise<IAPISuccessResponse> {
    const gradeScale = await prisma.gradeScale.findFirst({
      where: { externalId, deletedAt: null },
    });

    if (!gradeScale) {
      throw ApiError.format(null, GradeMessages.GRADE_SCALE_NOT_FOUND);
    }

    const minPercentage = payload.minPercentage ?? gradeScale.minPercentage;
    const maxPercentage = payload.maxPercentage ?? gradeScale.maxPercentage;

    await this.assertNoOverlap(minPercentage, maxPercentage, gradeScale.id);

    const updatedGradeScale = await prisma.gradeScale.update({
      where: { id: gradeScale.id },
      data: { ...payload, updatedBy: payload.updatedBy ?? null },
    });

    return {
      keyName: 'gradeScale',
      gradeScale: updatedGradeScale,
      code: GradeMessages.GRADE_SCALE_UPDATED_SUCCESSFULLY.code,
      message: GradeMessages.GRADE_SCALE_UPDATED_SUCCESSFULLY.message,
    };
  }

  async deleteGradeScale(externalId: string): Promise<IAPISuccessResponse> {
    const gradeScale = await prisma.gradeScale.findFirst({
      where: { externalId, deletedAt: null },
    });

    if (!gradeScale) {
      throw ApiError.format(null, GradeMessages.GRADE_SCALE_NOT_FOUND);
    }

    await prisma.gradeScale.update({
      where: { id: gradeScale.id },
      data: { deletedAt: new Date() },
    });

    return {
      keyName: 'result',
      result: true,
      code: GradeMessages.GRADE_SCALE_DELETED_SUCCESSFULLY.code,
      message: GradeMessages.GRADE_SCALE_DELETED_SUCCESSFULLY.message,
    };
  }

  async resolveGradeForPercentage(pct: number): Promise<{ grade: string; remarks: string }> {
    const band = await prisma.gradeScale.findFirst({
      where: { deletedAt: null, minPercentage: { lte: pct }, maxPercentage: { gte: pct } },
      orderBy: { minPercentage: 'desc' },
    });

    if (!band) {
      throw ApiError.format('', GradeMessages.NO_GRADE_FOR_PERCENTAGE);
    }

    return { grade: band.grade, remarks: band.remarks };
  }
}

export default new GradeService();
