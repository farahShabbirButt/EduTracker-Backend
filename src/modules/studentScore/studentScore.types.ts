export interface IStudentScoreItem {
  studentExternalId: string;
  marksObtained: number | null;
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
