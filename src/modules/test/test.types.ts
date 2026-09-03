import { TestType } from '@prisma/client';
import { IBaseEntity } from 'common/base/baseEntity.js';

export interface ITestSubjectInput {
  subjectExternalId: string;
  maxMarks: number;
}

export interface ICreateTest extends IBaseEntity {
  name: string;
  testType: TestType;
  month: number;
  year: number;
  totalMarks: number;
  classExternalId: string;
  subjects: ITestSubjectInput[];
}

export interface ISetTestSubjects {
  subjects: ITestSubjectInput[];
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
