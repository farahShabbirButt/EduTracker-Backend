export type ReportMode = 'MONTHLY';

export interface IReportPeriod {
  from: { month: number; year: number };
  to: { month: number; year: number };
}

export interface IReportCardSubjectColumn {
  externalId: string;
  name: string;
}

export interface IReportCardRow {
  testExternalId: string;
  testName: string;
  month: number;
  year: number;
  // No key: the student wasn't examined in that subject. obtained null: their mark isn't entered yet.
  marks: Record<string, { obtained: number | null; max: number }>;
  // Entered marks only, and the max of those subjects
  total: number;
  maxTotal: number;
  // null while nothing is entered
  percentage: number | null;
  grade: string | null;
}

export interface IReportCardOverall {
  obtainedMarks: number;
  totalMarks: number;
  percentage: number | null;
  grade: string | null;
  status: 'PASS' | 'FAIL' | null;
  remarks: string;
}

export interface IReportCardPosition {
  rank: number;
  outOf: number;
  // Someone in the class still has marks to enter, so this can change
  provisional: boolean;
}

export interface IReportCard {
  institute: { name: string; address: string; phone: string; logo: string | null };
  student: { name: string; fatherName: string; class: string; rollNumber: string };
  title: string;
  period: IReportPeriod;
  subjects: IReportCardSubjectColumn[];
  rows: IReportCardRow[];
  subjectTotals: Record<string, { obtained: number; max: number }>;
  overall: IReportCardOverall;
  // The month the ratings are from, the latest one rated in the period
  conduct: {
    behaviour: string | null;
    uniformCleanliness: string | null;
    month: number | null;
    year: number | null;
  };
  position: IReportCardPosition | null;
  missingMarks: { testName: string; subjectName: string }[];
}
