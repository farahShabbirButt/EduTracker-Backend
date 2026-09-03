import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateMarksEntry, IGetMarksEntryQuery, StudentScoreMessages } from './index.js';

class StudentScoreService {
  async enterMarks(payload: ICreateMarksEntry): Promise<IAPISuccessResponse> {
    const { classExternalId, testExternalId, subjectExternalId, scores } = payload;

    //Validate class
    const classData = await prisma.class.findUnique({
      where: { externalId: classExternalId, isActive: true, deletedAt: null },
    });

    if (!classData) {
      throw ApiError.format('', StudentScoreMessages.CLASS_NOT_FOUND);
    }

    //Validate test
    const testData = await prisma.test.findUnique({
      where: { externalId: testExternalId, isActive: true, deletedAt: null },
    });

    if (!testData || testData.classId !== classData.id) {
      throw ApiError.format('', StudentScoreMessages.TEST_NOT_FOUND);
    }

    // Resolve the TestSubject once, up front — the per-test-per-subject config row
    const testSubject = await prisma.testSubject.findFirst({
      where: {
        testId: testData.id,
        deletedAt: null,
        subjectClass: {
          classId: classData.id,
          subject: { externalId: subjectExternalId, isActive: true, deletedAt: null },
        },
      },
    });

    if (!testSubject) {
      throw ApiError.format('', StudentScoreMessages.SUBJECT_NOT_IN_TEST);
    }

    // Validate every score BEFORE opening the transaction — a failure halfway through
    // must not leave earlier writes committed.
    for (const item of scores) {
      if (item.marksObtained < 0) {
        throw ApiError.format('', StudentScoreMessages.MARKS_NEGATIVE);
      }
      if (item.marksObtained > testSubject.maxMarks) {
        throw ApiError.format('', StudentScoreMessages.MARKS_EXCEED_TOTAL);
      }
    }

    // Resolve students in one query (replaces the per-student N+1 lookup)
    const students = await prisma.student.findMany({
      where: {
        externalId: { in: scores.map((s) => s.studentExternalId) },
        classId: classData.id,
        isActive: true,
        deletedAt: null,
      },
    });
    const byExternalId = new Map(students.map((s) => [s.externalId, s.id]));

    // Students that don't belong to this class are silently skipped, but counted so a
    // typo in the request is not invisible.
    const skippedStudentsCount = scores.filter((item) => !byExternalId.has(item.studentExternalId)).length;

    await prisma.$transaction(
      scores
        .filter((item) => byExternalId.has(item.studentExternalId))
        .map((item) =>
          prisma.studentScore.upsert({
            where: {
              studentId_testSubjectId: {
                studentId: byExternalId.get(item.studentExternalId)!,
                testSubjectId: testSubject.id,
              },
            },
            create: {
              studentId: byExternalId.get(item.studentExternalId)!,
              testSubjectId: testSubject.id,
              marksObtained: item.marksObtained,
            },
            update: { marksObtained: item.marksObtained },
          }),
        ),
    );

    return {
      keyName: 'studentScores',
      studentScores: { skippedStudentsCount },
      code: StudentScoreMessages.MARKS_SAVED_SUCCESSFULLY.code,
      message: StudentScoreMessages.MARKS_SAVED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getMarksEntryStudents(query: IGetMarksEntryQuery): Promise<IAPISuccessResponse> {
    const { classExternalId, subjectExternalId, testExternalId } = query;

    // Validate Class
    const classData = await prisma.class.findUnique({
      where: {
        externalId: classExternalId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!classData) {
      throw ApiError.format('', StudentScoreMessages.CLASS_NOT_FOUND);
    }

    // Validate Test
    const testData = await prisma.test.findUnique({
      where: {
        externalId: testExternalId,
        isActive: true,
        deletedAt: null,
      },
    });

    if (!testData || testData.classId !== classData.id) {
      throw ApiError.format('', StudentScoreMessages.TEST_NOT_FOUND);
    }

    // Validate Subject belongs to Class (via SubjectClass)
    const subjectClass = await prisma.subjectClass.findFirst({
      where: {
        classId: classData.id,
        subject: {
          externalId: subjectExternalId,
          isActive: true,
          deletedAt: null,
        },
      },
      include: {
        subject: true,
      },
    });

    if (!subjectClass) {
      throw ApiError.format('', StudentScoreMessages.SUBJECT_NOT_FOUND);
    }

    // Resolve the TestSubject config row — the entry UI needs its per-subject maxMarks,
    // and scores are now keyed off testSubjectId, not testId + subjectClassId.
    const testSubject = await prisma.testSubject.findFirst({
      where: { testId: testData.id, subjectClassId: subjectClass.id, deletedAt: null },
    });

    if (!testSubject) {
      throw ApiError.format('', StudentScoreMessages.SUBJECT_NOT_IN_TEST);
    }

    // Fetch students assigned to this subject
    const students = await prisma.student.findMany({
      where: {
        classId: classData.id,
        isActive: true,
        deletedAt: null,
        studentSubjects: {
          some: {
            subjectClassId: subjectClass.id,
          },
        },
      },
      orderBy: {
        rollNumber: 'asc',
      },
    });

    // Fetch existing scores for this test & subject
    const scores = await prisma.studentScore.findMany({
      where: {
        testSubjectId: testSubject.id,
      },
    });

    //Create map for quick lookup
    const scoreMap = new Map<number, number>();

    scores.forEach((score) => {
      scoreMap.set(score.studentId, score.marksObtained);
    });

    // Merge students with marks — explicit projection so internal id/classId never leave the service layer
    const formattedStudents = students.map((student) => ({
      externalId: student.externalId,
      firstName: student.firstName,
      lastName: student.lastName,
      fatherName: student.fatherName,
      rollNumber: student.rollNumber,
      marksObtained: scoreMap.get(student.id) ?? null,
    }));

    // Return structured response
    return {
      keyName: 'marksEntry',
      marksEntry: {
        class: {
          externalId: classData.externalId,
          name: classData.name,
        },
        test: {
          externalId: testData.externalId,
          name: testData.name,
          totalMarks: testData.totalMarks,
          maxMarks: testSubject.maxMarks,
          month: testData.month,
          year: testData.year,
        },
        subject: {
          externalId: subjectClass.subject.externalId,
          name: subjectClass.subject.name,
        },
        students: formattedStudents,
      },
      code: StudentScoreMessages.STUDENT_SCORE_FETCHED_SUCCESSFULLY.code,
      message: StudentScoreMessages.STUDENT_SCORE_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }
}

export default new StudentScoreService();
