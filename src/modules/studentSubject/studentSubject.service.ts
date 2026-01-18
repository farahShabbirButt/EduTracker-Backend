import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { StudentSubjectMessages, ICreateStudentSubjects } from './index.js';
import { SubjectType } from '@prisma/client';

class StudentSubjectService {
  async assignSubjectsToStudent(params: ICreateStudentSubjects) {
    const { studentId, classId, subjectIds = [], replaceExisting = false } = params;
    // Fetch all active subjects of class
    const classSubjects = await prisma.subjectClass.findMany({
      where: {
        classId,
      },
      include: {
        subject: true,
      },
    });

    const compulsorySubjects: any = [];
    const electiveSubjects: any = [];

    for (const sc of classSubjects) {
      if (sc.subject.subjectType === SubjectType.COMPULSORY) compulsorySubjects.push(sc);
      else if (sc.subject.subjectType === SubjectType.ELECTIVE) electiveSubjects.push(sc);
    }

    // Validate elective selection
    const selectedElectives = electiveSubjects.filter((sc: any) => subjectIds.includes(sc.subject.externalId));

    if (selectedElectives.length !== subjectIds.length) {
      throw ApiError.format('', StudentSubjectMessages.INVALID_ELECTIVE_SUBJECTS);
    }
    // Remove existing assignments
    if (replaceExisting) {
      await prisma.studentSubject.deleteMany({
        where: {
          studentId,
        },
      });
    }

    // Prepare new assignments
    const studentSubjectsData = [...compulsorySubjects, ...selectedElectives].map((sc) => ({
      studentId,
      subjectClassId: sc.id,
    }));

    // Assign subjects
    if (studentSubjectsData.length) {
      await prisma.studentSubject.createMany({
        data: studentSubjectsData,
      });
    }
  }
}

export default new StudentSubjectService();
