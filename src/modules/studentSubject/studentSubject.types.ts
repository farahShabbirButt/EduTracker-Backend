export interface ICreateStudentSubjects {
  studentId: number;
  classId: number;
  subjectIds: string[];
  createdBy?: string;
  replaceExisting?: boolean;
}
