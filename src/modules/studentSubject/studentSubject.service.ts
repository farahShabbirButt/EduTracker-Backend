import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { StudentSubjectMessages, ICreateStudentSubjects } from './index.js';
import { Prisma, SubjectType } from '@prisma/client';

class StudentSubjectService {
  // Pass `tx` to run inside the caller's transaction (e.g. student create/update)
  async assignSubjectsToStudent(params: ICreateStudentSubjects, tx: Prisma.TransactionClient = prisma) {
    const { studentId, classId, subjectIds = [], replaceExisting = false } = params;
    // Fetch all active subjects of class
    const classSubjects = await tx.subjectClass.findMany({
      where: {
        classId,
        deletedAt: null,
        subject: { isActive: true, deletedAt: null },
      },
      include: {
        subject: true,
      },
    });

    const compulsorySubjects = classSubjects.filter((sc) => sc.subject.subjectType === SubjectType.COMPULSORY);
    const electiveSubjects = classSubjects.filter((sc) => sc.subject.subjectType === SubjectType.ELECTIVE);

    // Validate elective selection
    const selectedElectives = electiveSubjects.filter((sc) => subjectIds.includes(sc.subject.externalId));

    if (selectedElectives.length !== subjectIds.length) {
      throw ApiError.format('', StudentSubjectMessages.INVALID_ELECTIVE_SUBJECTS);
    }
    // Remove existing assignments
    if (replaceExisting) {
      await tx.studentSubject.deleteMany({
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
      await tx.studentSubject.createMany({
        data: studentSubjectsData,
      });
    }
  }
}

export default new StudentSubjectService();
