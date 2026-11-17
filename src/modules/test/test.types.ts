import { TestType } from '@prisma/client';
import { IBaseEntity } from 'common/base/baseEntity.js';

export interface ITestSubjectInput {
  subjectExternalId: string;
  maxMarks: number;
}

export interface ICreateTest extends IBaseEntity {
  name: string;
  testType: TestType;
  month?: number;
  year?: number;
  // YYYY-MM-DD, session tests only
  testDate?: string;
  totalMarks: number;
  classExternalId: string;
  subjects: ITestSubjectInput[];
}

export interface IUpdateTest {
  name?: string;
  testType?: TestType;
  month?: number;
  year?: number;
  testDate?: string;
  totalMarks?: number;
  classExternalId?: string;
  subjects?: ITestSubjectInput[];
  isActive?: boolean;
  updatedBy?: string;
}

// The validator coerces month and year to numbers; the service still runs them through Number()
export interface IGetAllTestsQuery {
  classExternalId?: string;
  month?: number;
  year?: number;
}

export interface IImportTests {
  dryRun: boolean;
  classId?: string;
  rows: {
    row: number;
    className?: string;
    name?: string;
    testType?: string;
    month?: string;
    year?: string;
    testDate?: string;
    subject?: string;
    maxMarks?: string;
  }[];
  createdBy?: string;
}
