import { Prisma, SubjectType } from '@prisma/client';
import { IBaseEntity } from '../../common/base/baseEntity.js';
import { v4 as uuid } from 'uuid';

// Internal id and audit columns stay in the service layer
export const SUBJECT_PUBLIC_FIELDS = {
  externalId: true,
  name: true,
  subjectType: true,
  maxMarks: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.SubjectSelect;

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
export interface IGetAllSubjectsQuery {
  classExternalId?: string;
}
