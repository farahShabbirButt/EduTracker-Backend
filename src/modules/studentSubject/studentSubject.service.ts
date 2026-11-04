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
    // Clears the old class and this class's electives. Compulsory enrolments and any on a
    // subject removed from the class stay, so saving a student can't take them off a marks sheet.
    if (replaceExisting) {
      await tx.studentSubject.deleteMany({
        where: {
          studentId,
          OR: [
            { subjectClass: { classId: { not: classId } } },
            { subjectClass: { classId, deletedAt: null, subject: { subjectType: SubjectType.ELECTIVE } } },
          ],
        },
      });
    }

    const held = await tx.studentSubject.findMany({
      where: { studentId },
      select: { subjectClass: { select: { subjectId: true } } },
    });
    const heldSubjectIds = new Set(held.map((ss) => ss.subjectClass.subjectId));

    // Prepare new assignments
    const studentSubjectsData = [...compulsorySubjects, ...selectedElectives]
      .filter((sc) => !heldSubjectIds.has(sc.subjectId))
      .map((sc) => ({
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
