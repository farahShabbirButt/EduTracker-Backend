export interface ICreateStudent {
  firstName: string;
  lastName: string;
  fatherName: string;
  rollNumber: string;
  email?: string;
  contactNo?: string;
  classId: string;
  // YYYY-MM-DD; today when left out
  joinedOn?: string;
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
  // YYYY-MM-DD. Left out, a class move sets it to today
  joinedOn?: string;
  isActive?: boolean;
  // ONLY elective subjects selected by user
  electiveSubjectIds?: string[];
}

export interface IImportStudentRow {
  row: number;
  className?: string;
  rollNumber?: string;
  firstName?: string;
  lastName?: string;
  fatherName?: string;
  contactNo?: string;
  email?: string;
  electives?: string;
  joinedOn?: string;
}

export interface IImportStudents {
  dryRun: boolean;
  classId?: string;
  joinedOn: string;
  rows: IImportStudentRow[];
  createdBy?: string;
}
