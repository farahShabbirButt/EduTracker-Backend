import { IBaseEntity } from '../../common/base/baseEntity.js';

export interface ISubjectClass extends IBaseEntity {
  subjectId: number;
  classId: number;
}

export interface ICreateSubjectClass {
  classId: string;
  subjectIds: string[];
  createdBy?: string;
}

export interface IResolvedSubjectClass {
  classId: number;
  subjectIds: number[];
}
