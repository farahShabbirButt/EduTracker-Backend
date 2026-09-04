export type ReportMode = 'MONTHLY';

export interface IReportCardSubjectColumn {
  externalId: string;
  name: string;
}

export interface IReportCardRow {
  testName: string;
  marks: Record<string, { obtained: number; max: number }>;
  total: number;
  maxTotal: number;
  percentage: number;
  grade: string;
}

export interface IReportCardOverall {
  obtainedMarks: number;
  totalMarks: number;
  percentage: number;
  grade: string;
  status: 'PASS' | 'FAIL';
  remarks: string;
}

export interface IReportCardPosition {
  rank: number;
  outOf: number;
}

export interface IReportCard {
  institute: { name: string; address: string; phone: string };
  student: { name: string; fatherName: string; class: string; rollNumber: string };
  title: string;
  subjects: IReportCardSubjectColumn[];
  rows: IReportCardRow[];
  subjectTotals: Record<string, { obtained: number; max: number }>;
  overall: IReportCardOverall;
  conduct: { behaviour: string | null; uniformCleanliness: string | null };
  position: IReportCardPosition | null;
}
