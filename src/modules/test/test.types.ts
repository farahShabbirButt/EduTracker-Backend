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
  subjects?: ITestSubjectInput[];
  isActive?: boolean;
  updatedBy?: string;
}

// Query values reach the service as the strings Express parsed, not the validator's numbers
export interface IGetAllTestsQuery {
  classExternalId?: string;
  month?: string;
  year?: string;
}
