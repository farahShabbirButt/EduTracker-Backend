import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateMarksEntry, IGetMarksEntryQuery, StudentScoreMessages } from './index.js';

class StudentScoreService {
  async enterMarks(payload: ICreateMarksEntry): Promise<IAPISuccessResponse> {
    try {
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

      // Validate subjectClass
      const subjectClass = await prisma.subjectClass.findFirst({
        where: {
          classId: classData.id,
          subject: {
            externalId: subjectExternalId,
            isActive: true,
            deletedAt: null,
          },
        },
        include: { subject: true },
      });

      if (!subjectClass) {
        throw ApiError.format('', StudentScoreMessages.SUBJECT_NOT_FOUND);
      }

      // Process each student score
      for (const item of scores) {
        const student = await prisma.student.findUnique({
          where: { externalId: item.studentExternalId, isActive: true, deletedAt: null },
        });

        if (!student || student.classId !== classData.id) {
          continue; // skip invalid students safely
        }

        // Validate marks not exceeding total
        if (item.marksObtained > testData.totalMarks) {
          throw ApiError.format('', StudentScoreMessages.MARKS_EXCEED_TOTAL);
        }

        const existingScore = await prisma.studentScore.findFirst({
          where: {
            studentId: student.id,
            testId: testData.id,
            subjectClassId: subjectClass.id,
          },
        });

        if (existingScore) {
          await prisma.studentScore.update({
            where: { id: existingScore.id },
            data: { marksObtained: item.marksObtained },
          });
        } else {
          await prisma.studentScore.create({
            data: {
              studentId: student.id,
              testId: testData.id,
              subjectClassId: subjectClass.id,
              marksObtained: item.marksObtained,
            },
          });
        }
      }

      return {
        keyName: 'studentScores',
        code: StudentScoreMessages.MARKS_SAVED_SUCCESSFULLY.code,
        message: StudentScoreMessages.MARKS_SAVED_SUCCESSFULLY.message,
        success: true,
      };
    } catch (error) {
      throw ApiError.format(error, StudentScoreMessages.MARKS_SAVE_FAILURE);
    }
  }

  async getMarksEntryStudents(query: IGetMarksEntryQuery): Promise<IAPISuccessResponse> {
    try {
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
          testId: testData.id,
          subjectClassId: subjectClass.id,
        },
      });

      //Create map for quick lookup
      const scoreMap = new Map<number, number>();

      scores.forEach((score) => {
        scoreMap.set(score.studentId, score.marksObtained);
      });

      // Merge students with marks
      const formattedStudents = students.map((student) => ({
        ...student,
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
    } catch (error) {
      throw ApiError.format(error, StudentScoreMessages.STUDENT_SCORE_FETCH_FAILUE);
    }
  }
}

export default new StudentScoreService();
