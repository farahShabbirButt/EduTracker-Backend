import { Prisma, SubjectType } from '@prisma/client';
import { IBaseEntity } from '../../common/base/baseEntity.js';
import { v4 as uuid } from 'uuid';

export interface ISubject extends IBaseEntity {
  name: string;
  subjectType: SubjectType;
  maxMarks: number;
  isActive: boolean;
}
export interface ICreateSubject {
  name: string;
  subjectType: SubjectType;
  maxMarks: number;
  isActive?: boolean;
  createdBy?: string;
}

export interface IUpdateSubject {
  name?: string;
  subjectType?: SubjectType;
  maxMarks?: number;
  isActive?: boolean;
  updatedBy?: string;
}
export function createSubjectMapper(payload: ICreateSubject): Prisma.SubjectCreateInput {
  return {
    externalId: uuid(),
    name: payload.name,
    subjectType: payload.subjectType,
    maxMarks: payload.maxMarks,
    isActive: payload?.isActive ?? true,
    createdBy: payload.createdBy ?? null,
  };
}
