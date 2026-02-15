import { TestType } from '@prisma/client';
import { IBaseEntity } from 'common/base/baseEntity.js';

export interface ICreateTest extends IBaseEntity {
  name: string;
  testType: TestType;
  month: number;
  year: number;
  totalMarks: number;
  classExternalId: string;
}

export interface IUpdateTest {
  name?: string;
  testType?: TestType;
  month?: number;
  year?: number;
  totalMarks?: number;
  classExternalId?: string;
  isActive?: boolean;
  updatedBy?: string;
}
