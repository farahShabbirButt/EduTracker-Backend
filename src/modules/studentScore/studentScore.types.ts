import { IBaseEntity } from '../../common/base/baseEntity.js';

export interface IStudentScoreItem {
  studentExternalId: string;
  marksObtained: number;
}
export interface IMarksEntry extends IBaseEntity {
  studentId: number;
  testId: number;
  subjectClassId: number;
  marksObtained: number;
}
export interface ICreateMarksEntry {
  classExternalId: string;
  testExternalId: string;
  subjectExternalId: string;
  scores: IStudentScoreItem[];
}
export interface IGetMarksEntryQuery {
  classExternalId: string;
  subjectExternalId: string;
  testExternalId: string;
}
