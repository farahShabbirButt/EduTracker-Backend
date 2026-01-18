import { IBaseEntity } from '../../common/base/baseEntity.js';

export interface IStudentSubjects extends IBaseEntity {
  studentId: number;
  subjectClassId: number;
}

export interface ICreateStudentSubjects {
  studentId: number;
  classId: number;
  subjectIds: string[];
  createdBy?: string;
  replaceExisting?: boolean;
}

export interface IResolvedStudentSubjects {
  studentId: number;
  subjectIds: number[];
}
