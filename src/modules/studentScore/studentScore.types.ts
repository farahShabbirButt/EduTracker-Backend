export interface IMarksGridCell {
  studentExternalId: string;
  subjectExternalId: string;
  marksObtained: number | null;
}

export interface ISaveMarksGrid {
  classExternalId: string;
  testExternalId: string;
  marks: IMarksGridCell[];
}

export interface IGetMarksGridQuery {
  classExternalId: string;
  testExternalId: string;
}
