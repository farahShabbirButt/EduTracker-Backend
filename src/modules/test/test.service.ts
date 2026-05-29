import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ICreateTest, IUpdateTest, TestMessages } from './index.js';
import { TestType } from '@prisma/client';

class TestService {
  async createTest(payload: ICreateTest): Promise<IAPISuccessResponse> {
    try {
      // 1️⃣ Get class
      const classData = await prisma.class.findUnique({
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
      const existingTest = await prisma.test.findFirst({
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

      // 4️⃣ Create test
      const createdTest = await prisma.test.create({
        data: {
          name: payload.name,
          testType: payload.testType,
          month: payload.month ?? null,
          year: payload.year ?? null,
          totalMarks: payload.totalMarks,
          classId: classData.id,
        },
      });

      return {
        keyName: 'test',
        test: createdTest,
        code: TestMessages.TEST_CREATED_SUCCESSFULLY.code,
        message: TestMessages.TEST_CREATED_SUCCESSFULLY.message,
        success: true,
      };
    } catch (error) {
      throw ApiError.format(error, TestMessages.TEST_CREATION_FAILURE);
    }
  }

  async updateTest(externalId: string, payload: IUpdateTest): Promise<IAPISuccessResponse> {
    try {
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
    } catch (error) {
      throw ApiError.format(error, TestMessages.TEST_UPDATE_FAILURE);
    }
  }
  async deleteTest(externalId: string): Promise<IAPISuccessResponse> {
    try {
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
    } catch (error) {
      throw ApiError.format(error, TestMessages.TEST_DELETION_FAILURE);
    }
  }
  async getAllTests(query: any): Promise<IAPISuccessResponse> {
    try {
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
    } catch (error) {
      throw ApiError.format(error, TestMessages.TEST_FETCH_FAILURE);
    }
  }
  async getTestById(externalId: string): Promise<IAPISuccessResponse> {
    try {
      const test = await prisma.test.findUnique({
        where: { externalId, isActive: true, deletedAt: null },
        include: {
          class: true,
          scores: true,
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
    } catch (error) {
      throw ApiError.format(error, TestMessages.TEST_FETCH_FAILURE);
    }
  }
}

export default new TestService();
