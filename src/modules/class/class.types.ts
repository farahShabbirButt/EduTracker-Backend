import { Prisma } from '@prisma/client';
import { v4 as uuid } from 'uuid';

export interface ICreateClass {
  name: string;
  isActive?: boolean;
  createdBy?: string;
}

export interface IUpdateClass {
  name?: string;
  isActive?: boolean;
  updatedBy?: string;
}
export function createClassMapper(payload: ICreateClass): Prisma.ClassCreateInput {
  return {
    externalId: uuid(),
    name: payload.name,
    isActive: payload.isActive ?? true,
    createdBy: payload.createdBy ?? null,
  };
}

export interface IImportClasses {
  dryRun: boolean;
  rows: { row: number; name?: string }[];
  createdBy?: string;
}
