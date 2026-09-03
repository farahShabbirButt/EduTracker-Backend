import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateTest, ISetTestSubjects, IUpdateTest, TestMessages } from './index.js';
import { TestType } from '@prisma/client';

class TestService {
  async createTest(payload: ICreateTest): Promise<IAPISuccessResponse> {
    return await prisma.$transaction(async (tx) => {
      // 1️⃣ Get class
      const classData = await tx.class.findUnique({
        where: {
          externalId: payload.classExternalId,
          isActive: true,
          deletedAt: null,
        },
      });

      if (!classData) {
        throw ApiError.format('', TestMessages.CLASS_NOT_FOUND);
      }

      // 2️⃣ Validate month/year for MONTHLY
      if (payload.testType === TestType.MONTHLY) {
        if (!payload.month || !payload.year) {
          throw ApiError.format('', TestMessages.MONTH_YEAR_REQUIRED);
        }
      }

      // 3️⃣ Check duplicate test
      const existingTest = await tx.test.findFirst({
        where: {
          classId: classData.id,
          name: payload.name,
          month: payload.month,
          year: payload.year,
          testType: payload.testType,
          isActive: true,
          deletedAt: null,
        },
      });

      if (existingTest) {
        throw ApiError.format('', TestMessages.TEST_ALREADY_EXISTS);
      }

      // 4️⃣ Resolve each subject to a SubjectClass row for THIS class
      const resolvedSubjects: { subjectClassId: number; maxMarks: number }[] = [];

      for (const item of payload.subjects) {
        const subjectClass = await tx.subjectClass.findFirst({
          where: {
            classId: classData.id,
            subject: {
              externalId: item.subjectExternalId,
              isActive: true,
              deletedAt: null,
            },
            deletedAt: null,
          },
        });

        if (!subjectClass) {
          throw ApiError.format('', TestMessages.SUBJECT_NOT_IN_CLASS);
        }

        resolvedSubjects.push({ subjectClassId: subjectClass.id, maxMarks: item.maxMarks });
      }

      // 5️⃣ Derive the authoritative total from the subjects
      const totalMarks = resolvedSubjects.reduce((sum, s) => sum + s.maxMarks, 0);

      // 6️⃣ Create test
      const createdTest = await tx.test.create({
        data: {
          name: payload.name,
          testType: payload.testType,
          month: payload.month ?? null,
          year: payload.year ?? null,
          totalMarks,
          classId: classData.id,
        },
      });

      // 7️⃣ Create its TestSubject rows — a test can never exist without them
      await tx.testSubject.createMany({
        data: resolvedSubjects.map((s) => ({
          testId: createdTest.id,
          subjectClassId: s.subjectClassId,
          maxMarks: s.maxMarks,
          createdBy: payload.createdBy ?? null,
        })),
      });

      return {
        keyName: 'test',
        test: createdTest,
        code: TestMessages.TEST_CREATED_SUCCESSFULLY.code,
        message: TestMessages.TEST_CREATED_SUCCESSFULLY.message,
        success: true,
      };
    });
  }

  async updateTest(externalId: string, payload: IUpdateTest): Promise<IAPISuccessResponse> {
    const existingTest = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
    });

    if (!existingTest) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    // Resolve classId only if classExternalId is provided
    let classId = existingTest.classId;

    if (payload.classExternalId) {
      const classData = await prisma.class.findFirst({
        where: { externalId: payload.classExternalId, isActive: true, deletedAt: null },
      });

      if (!classData) {
        throw ApiError.format('', TestMessages.CLASS_NOT_FOUND);
      }

      classId = classData.id;
    }

    // Duplicate check (exclude current test)
    const duplicate = await prisma.test.findFirst({
      where: {
        id: { not: existingTest.id },
        classId: classId,
        name: payload.name,
        month: payload.month,
        year: payload.year,
        testType: payload.testType,
        isActive: true,
        deletedAt: null,
      },
    });

    if (duplicate) {
      throw ApiError.format('', TestMessages.TEST_ALREADY_EXISTS);
    }

    const updatedTest = await prisma.test.update({
      where: { id: existingTest.id },
      data: {
        name: payload.name,
        testType: payload.testType,
        month: payload.month,
        year: payload.year,
        totalMarks: payload.totalMarks,
        classId: classId,
      },
    });

    return {
      keyName: 'test',
      test: updatedTest,
      code: TestMessages.TEST_UPDATED_SUCCESSFULLY.code,
      message: TestMessages.TEST_UPDATED_SUCCESSFULLY.message,
      success: true,
    };
  }
  async deleteTest(externalId: string): Promise<IAPISuccessResponse> {
    const test = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
    });

    if (!test) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    await prisma.test.update({
      where: { id: test.id },
      data: {
        isActive: false,
        deletedAt: new Date(),
      },
    });

    return {
      keyName: 'test',
      code: TestMessages.TEST_DELETED_SUCCESSFULLY.code,
      message: TestMessages.TEST_DELETED_SUCCESSFULLY.message,
      success: true,
    };
  }
  async getAllTests(query: any): Promise<IAPISuccessResponse> {
    const { classExternalId, month, year } = query;
    const whereCondition: any = {
      isActive: true,
      deletedAt: null,
    };
    if (classExternalId) {
      const classData = await prisma.class.findUnique({
        where: { externalId: classExternalId, isActive: true, deletedAt: null },
      });

      if (!classData) {
        throw ApiError.format('', TestMessages.CLASS_NOT_FOUND);
      }

      whereCondition.classId = classData.id;
    }

    if (month) {
      whereCondition.month = Number(month);
    }

    if (year) {
      whereCondition.year = Number(year);
    }

    const tests = await prisma.test.findMany({
      where: whereCondition,
      include: {
        class: true,
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return {
      keyName: 'tests',
      tests,
      code: TestMessages.TESTS_LIST_FETCHED_SUCCESSFULLY.code,
      message: TestMessages.TESTS_LIST_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }
  async getTestById(externalId: string): Promise<IAPISuccessResponse> {
    const test = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
      include: {
        class: true,
      },
    });

    if (!test) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    return {
      keyName: 'test',
      test,
      code: TestMessages.TEST_FETCHED_SUCCESSFULLY.code,
      message: TestMessages.TEST_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async getTestSubjects(externalId: string): Promise<IAPISuccessResponse> {
    const test = await prisma.test.findUnique({
      where: { externalId, isActive: true, deletedAt: null },
    });

    if (!test) {
      throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
    }

    const testSubjects = await prisma.testSubject.findMany({
      where: { testId: test.id, deletedAt: null },
      include: { subjectClass: { include: { subject: true } } },
      orderBy: { id: 'asc' },
    });

    return {
      keyName: 'testSubjects',
      testSubjects: testSubjects.map((ts) => ({
        externalId: ts.externalId,
        subject: {
          externalId: ts.subjectClass.subject.externalId,
          name: ts.subjectClass.subject.name,
        },
        maxMarks: ts.maxMarks,
      })),
      code: TestMessages.TEST_SUBJECTS_FETCHED_SUCCESSFULLY.code,
      message: TestMessages.TEST_SUBJECTS_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async setTestSubjects(externalId: string, payload: ISetTestSubjects): Promise<IAPISuccessResponse> {
    return await prisma.$transaction(async (tx) => {
      const test = await tx.test.findUnique({
        where: { externalId, isActive: true, deletedAt: null },
      });

      if (!test) {
        throw ApiError.format('', TestMessages.TEST_NOT_FOUND);
      }

      // Resolve each subject to a SubjectClass row for THIS class
      const resolvedSubjects: { subjectClassId: number; maxMarks: number }[] = [];

      for (const item of payload.subjects) {
        const subjectClass = await tx.subjectClass.findFirst({
          where: {
            classId: test.classId,
            subject: {
              externalId: item.subjectExternalId,
              isActive: true,
              deletedAt: null,
            },
            deletedAt: null,
          },
        });

        if (!subjectClass) {
          throw ApiError.format('', TestMessages.SUBJECT_NOT_IN_CLASS);
        }

        resolvedSubjects.push({ subjectClassId: subjectClass.id, maxMarks: item.maxMarks });
      }

      // ALL TestSubject rows ever created for this test, active or soft-deleted. We need the
      // soft-deleted ones too: @@unique([testId, subjectClassId]) means re-adding a subject that
      // was previously removed from this test must resurrect its old row, not INSERT a duplicate.
      const allTestSubjects = await tx.testSubject.findMany({
        where: { testId: test.id },
        include: { scores: { where: { deletedAt: null } }, subjectClass: { include: { subject: true } } },
      });

      const activeTestSubjects = allTestSubjects.filter((ts) => ts.deletedAt === null);
      const incomingSubjectClassIds = resolvedSubjects.map((s) => s.subjectClassId);

      // Rows present now but missing from the incoming set — being removed
      const toRemove = activeTestSubjects.filter((ts) => !incomingSubjectClassIds.includes(ts.subjectClassId));

      const removalBlockedBy = toRemove.find((ts) => ts.scores.length > 0);
      if (removalBlockedBy) {
        throw ApiError.format(
          {
            message: `Cannot remove subject "${removalBlockedBy.subjectClass.subject.name}" — marks have already been entered for it`,
            code: TestMessages.TEST_SUBJECT_HAS_SCORES.code,
          },
          TestMessages.TEST_SUBJECT_HAS_SCORES,
        );
      }

      // Soft-delete removed rows
      if (toRemove.length > 0) {
        await tx.testSubject.updateMany({
          where: { id: { in: toRemove.map((ts) => ts.id) } },
          data: { deletedAt: new Date() },
        });
      }

      // Upsert the rest — resurrecting (deletedAt: null) any row that was previously soft-deleted
      const existingBySubjectClassId = new Map(allTestSubjects.map((ts) => [ts.subjectClassId, ts]));

      for (const item of resolvedSubjects) {
        const existing = existingBySubjectClassId.get(item.subjectClassId);

        if (existing) {
          await tx.testSubject.update({
            where: { id: existing.id },
            data: { maxMarks: item.maxMarks, deletedAt: null },
          });
        } else {
          await tx.testSubject.create({
            data: {
              testId: test.id,
              subjectClassId: item.subjectClassId,
              maxMarks: item.maxMarks,
            },
          });
        }
      }

      // Recompute the authoritative total from the subjects
      const totalMarks = resolvedSubjects.reduce((sum, s) => sum + s.maxMarks, 0);

      await tx.test.update({
        where: { id: test.id },
        data: { totalMarks },
      });

      const finalTestSubjects = await tx.testSubject.findMany({
        where: { testId: test.id, deletedAt: null },
        include: { subjectClass: { include: { subject: true } } },
        orderBy: { id: 'asc' },
      });

      return {
        keyName: 'testSubjects',
        testSubjects: finalTestSubjects.map((ts) => ({
          externalId: ts.externalId,
          subject: {
            externalId: ts.subjectClass.subject.externalId,
            name: ts.subjectClass.subject.name,
          },
          maxMarks: ts.maxMarks,
        })),
        code: TestMessages.TEST_SUBJECTS_UPDATED_SUCCESSFULLY.code,
        message: TestMessages.TEST_SUBJECTS_UPDATED_SUCCESSFULLY.message,
        success: true,
      };
    });
  }
}

export default new TestService();
