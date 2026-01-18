import { IBaseEntity } from '../../common/base/baseEntity.js';

export interface IStudent extends IBaseEntity {
  firstName: string;
  lastName: string;
  fatherName: string;
  rollNumber: string;
  email?: string;
  contactNo?: string;
  classId: number;
}
export interface ICreateStudent {
  firstName: string;
  lastName: string;
  fatherName: string;
  rollNumber: string;
  email?: string;
  contactNo?: string;
  classId: string;
  createdBy: string;
  isActive: boolean;
  // ONLY elective subjects selected by user
  electiveSubjectIds?: string[];
}
export interface IUpdateStudent {
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  rollNumber?: string;
  email?: string;
  contactNo?: string;
  classId?: string;
  isActive?: boolean;
  // ONLY elective subjects selected by user
  electiveSubjectIds?: string[];
}
