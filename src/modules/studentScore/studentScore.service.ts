import prisma, { LIVE_SCORES } from '../../lib/prisma.js';
import { owesTest } from '../../lib/marksDue.js';
import { ApiError } from '../../common/responses/index.js';
import { IGetMarksGridQuery, ISaveMarksGrid, StudentScoreMessages } from './index.js';

class StudentScoreService {
  private async findClassAndTest(classExternalId: string, testExternalId: string) {
    const classData = await prisma.class.findUnique({
      where: { externalId: classExternalId, isActive: true, deletedAt: null },
    });

    if (!classData) {
      throw ApiError.format('', StudentScoreMessages.CLASS_NOT_FOUND);
    }

    const testData = await prisma.test.findUnique({
      where: { externalId: testExternalId, isActive: true, deletedAt: null },
      include: {
        testSubjects: {
          where: { deletedAt: null },
          include: { subjectClass: { include: { subject: true } } },
          orderBy: { id: 'asc' },
        },
      },
    });

    if (!testData || testData.classId !== classData.id) {
      throw ApiError.format('', StudentScoreMessages.TEST_NOT_FOUND);
    }

    return { classData, testData };
  }

  // The class's students taking anything on the test, plus anyone holding a saved or cleared
  // mark on it: that mark is still on their card, so it must stay visible and fixable.
  private findGridStudents(classId: number, testSubjectIds: number[], subjectIds: number[]) {
    return prisma.student.findMany({
      where: {
        isActive: true,
        deletedAt: null,
        OR: [
          { classId, studentSubjects: { some: { subjectClass: { subjectId: { in: subjectIds } } } } },
          { scores: { some: { testSubjectId: { in: testSubjectIds } } } },
        ],
      },
      include: {
        studentSubjects: { select: { subjectClass: { select: { subjectId: true } } } },
        scores: {
          where: { testSubjectId: { in: testSubjectIds } },
          select: { testSubjectId: true, marksObtained: true, deletedAt: true },
        },
      },
    });
  }

  async getMarksGrid({ classExternalId, testExternalId }: IGetMarksGridQuery): Promise<IAPISuccessResponse> {
    const { classData, testData } = await this.findClassAndTest(classExternalId, testExternalId);
    const { testSubjects } = testData;

    const students = await this.findGridStudents(
      classData.id,
      testSubjects.map((ts) => ts.id),
      testSubjects.map((ts) => ts.subjectClass.subjectId),
    );

    // In register order: 2 comes before 10
    students.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));

    const rows = students.map((student) => {
      const inClass = student.classId === classData.id;
      const taken = new Set(student.studentSubjects.map((ss) => ss.subjectClass.subjectId));
      const live = new Map(
        student.scores.filter((s) => s.deletedAt === null).map((s) => [s.testSubjectId, s.marksObtained]),
      );
      const owes = inClass && owesTest(student.classSince, testData, live.size > 0);

      return {
        externalId: student.externalId,
        firstName: student.firstName,
        lastName: student.lastName,
        rollNumber: student.rollNumber,
        leftClass: !inClass,
        cells: Object.fromEntries(
          testSubjects.map((ts) => {
            const subjectId = ts.subjectClass.subjectId;
            const hasRow = student.scores.some((s) => s.testSubjectId === ts.id);
            return [
              ts.subjectClass.subject.externalId,
              {
                marksObtained: live.get(ts.id) ?? null,
                editable: hasRow || (inClass && taken.has(subjectId)),
                owed: owes && taken.has(subjectId),
              },
            ];
          }),
        ),
      };
    });

    return {
      keyName: 'marksGrid',
      marksGrid: {
        class: { externalId: classData.externalId, name: classData.name },
        test: {
          externalId: testData.externalId,
          name: testData.name,
          month: testData.month,
          year: testData.year,
        },
        subjects: testSubjects.map((ts) => ({
          externalId: ts.subjectClass.subject.externalId,
          name: ts.subjectClass.subject.name,
          maxMarks: ts.maxMarks,
        })),
        students: rows,
      },
      code: StudentScoreMessages.STUDENT_SCORE_FETCHED_SUCCESSFULLY.code,
      message: StudentScoreMessages.STUDENT_SCORE_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async saveMarksGrid(payload: ISaveMarksGrid): Promise<IAPISuccessResponse> {
    const { classData, testData } = await this.findClassAndTest(payload.classExternalId, payload.testExternalId);
    const { testSubjects } = testData;

    const bySubject = new Map(testSubjects.map((ts) => [ts.subjectClass.subject.externalId, ts]));
    const students = await this.findGridStudents(
      classData.id,
      testSubjects.map((ts) => ts.id),
      testSubjects.map((ts) => ts.subjectClass.subjectId),
    );
    const byExternalId = new Map(students.map((s) => [s.externalId, s]));

    // Every mark is checked before anything is written: it's all saved, or none of it
    const writes = payload.marks.map(({ studentExternalId, subjectExternalId, marksObtained }) => {
      const student = byExternalId.get(studentExternalId);
      const testSubject = bySubject.get(subjectExternalId);

      if (!testSubject) {
        throw ApiError.format('', StudentScoreMessages.SUBJECT_NOT_IN_TEST);
      }

      const editable =
        student &&
        (student.scores.some((s) => s.testSubjectId === testSubject.id) ||
          (student.classId === classData.id &&
            student.studentSubjects.some((ss) => ss.subjectClass.subjectId === testSubject.subjectClass.subjectId)));

      if (!student || !editable) {
        throw ApiError.format('', StudentScoreMessages.STUDENT_NOT_ON_SUBJECT);
      }

      if (marksObtained !== null && marksObtained > testSubject.maxMarks) {
        throw ApiError.format('', StudentScoreMessages.MARKS_EXCEED_TOTAL);
      }

      return { studentId: student.id, testSubjectId: testSubject.id, marksObtained };
    });

    await prisma.$transaction(
      writes.map(({ studentId, testSubjectId, marksObtained }) =>
        marksObtained === null
          ? prisma.studentScore.updateMany({
              where: { studentId, testSubjectId, ...LIVE_SCORES },
              data: { deletedAt: new Date() },
            })
          : // deletedAt: a mark that was cleared earlier can be entered again
            prisma.studentScore.upsert({
              where: { studentId_testSubjectId: { studentId, testSubjectId } },
              create: { studentId, testSubjectId, marksObtained },
              update: { marksObtained, deletedAt: null },
            }),
      ),
    );

    return {
      keyName: 'studentScores',
      studentScores: { saved: writes.length },
      code: StudentScoreMessages.MARKS_SAVED_SUCCESSFULLY.code,
      message: StudentScoreMessages.MARKS_SAVED_SUCCESSFULLY.message,
      success: true,
    };
  }
}

export default new StudentScoreService();
