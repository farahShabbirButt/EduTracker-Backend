import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { GradeMessages, createGradeScaleMapper, ICreateGradeScale, IUpdateGradeScale } from './index.js';
import { Prisma } from '@prisma/client';

// Internal id and audit columns stay in the service layer
const GRADE_SCALE_PUBLIC_FIELDS = {
  externalId: true,
  minPercentage: true,
  maxPercentage: true,
  grade: true,
  remarks: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.GradeScaleSelect;

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
      select: GRADE_SCALE_PUBLIC_FIELDS,
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
      select: GRADE_SCALE_PUBLIC_FIELDS,
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
      select: GRADE_SCALE_PUBLIC_FIELDS,
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

    if (minPercentage >= maxPercentage) {
      throw ApiError.format('', GradeMessages.GRADE_SCALE_MIN_ABOVE_MAX);
    }

    await this.assertNoOverlap(minPercentage, maxPercentage, gradeScale.id);

    const updatedGradeScale = await prisma.gradeScale.update({
      where: { id: gradeScale.id },
      data: { ...payload, updatedBy: payload.updatedBy ?? null },
      select: GRADE_SCALE_PUBLIC_FIELDS,
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

    // The next band up would quietly become the failing one
    const lowest = await prisma.gradeScale.findFirst({
      where: { deletedAt: null },
      orderBy: { minPercentage: 'asc' },
      select: { id: true },
    });

    if (lowest?.id === gradeScale.id) {
      throw ApiError.format('', GradeMessages.GRADE_SCALE_LOWEST);
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

  // A percentage in a gap between bands takes the band below it, so a gap can't stop a card
  // printing. The lowest band is the failing one, whatever the school calls it.
  async resolveGradeForPercentage(pct: number): Promise<{ grade: string; remarks: string; failing: boolean }> {
    const bands = await prisma.gradeScale.findMany({
      where: { deletedAt: null },
      orderBy: { minPercentage: 'desc' },
    });

    const lowest = bands[bands.length - 1];

    if (!lowest) {
      throw ApiError.format('', GradeMessages.NO_GRADE_FOR_PERCENTAGE);
    }

    const band = bands.find((b) => b.minPercentage <= pct) ?? lowest;

    return { grade: band.grade, remarks: band.remarks, failing: band.id === lowest.id };
  }
}

export default new GradeService();
