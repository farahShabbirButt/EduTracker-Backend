import { Prisma } from '@prisma/client';
import { IBaseEntity } from '../../common/base/baseEntity.js';
import { v4 as uuid } from 'uuid';

export interface IGradeScale extends IBaseEntity {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  remarks: string;
}

export interface ICreateGradeScale {
  minPercentage: number;
  maxPercentage: number;
  grade: string;
  remarks: string;
  createdBy?: string;
}

export interface IUpdateGradeScale {
  minPercentage?: number;
  maxPercentage?: number;
  grade?: string;
  remarks?: string;
  updatedBy?: string;
}

export function createGradeScaleMapper(payload: ICreateGradeScale): Prisma.GradeScaleCreateInput {
  return {
    externalId: uuid(),
    minPercentage: payload.minPercentage,
    maxPercentage: payload.maxPercentage,
    grade: payload.grade,
    remarks: payload.remarks,
    createdBy: payload.createdBy ?? null,
  };
}
