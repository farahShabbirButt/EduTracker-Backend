import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { ConductMessages, ISaveClassConduct } from './index.js';

class ConductService {
  private async findClass(classExternalId: string) {
    const classData = await prisma.class.findUnique({
      where: { externalId: classExternalId, isActive: true, deletedAt: null },
      select: { id: true, externalId: true, name: true },
    });

    if (!classData) {
      throw ApiError.format('', ConductMessages.CLASS_NOT_FOUND);
    }

    return classData;
  }

  async getClassConduct(classExternalId: string, month: number, year: number): Promise<IAPISuccessResponse> {
    const classData = await this.findClass(classExternalId);

    const students = await prisma.student.findMany({
      where: { classId: classData.id, isActive: true, deletedAt: null },
      select: {
        externalId: true,
        firstName: true,
        lastName: true,
        rollNumber: true,
        conducts: {
          where: { month, year, deletedAt: null },
          select: { behaviour: true, uniformCleanliness: true },
        },
      },
    });

    // In register order: 2 comes before 10
    students.sort((a, b) => a.rollNumber.localeCompare(b.rollNumber, undefined, { numeric: true }));

    return {
      keyName: 'classConduct',
      classConduct: {
        month,
        year,
        students: students.map(({ conducts, ...student }) => ({
          ...student,
          behaviour: conducts[0]?.behaviour ?? null,
          uniformCleanliness: conducts[0]?.uniformCleanliness ?? null,
        })),
      },
      code: ConductMessages.CONDUCT_FETCHED_SUCCESSFULLY.code,
      message: ConductMessages.CONDUCT_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async saveClassConduct(
    classExternalId: string,
    { month, year, entries }: ISaveClassConduct,
    userExternalId: string,
  ): Promise<IAPISuccessResponse> {
    const classData = await this.findClass(classExternalId);

    const students = await prisma.student.findMany({
      where: {
        classId: classData.id,
        isActive: true,
        deletedAt: null,
        externalId: { in: entries.map((entry) => entry.studentExternalId) },
      },
      select: { id: true, externalId: true },
    });
    const byExternalId = new Map(students.map((student) => [student.externalId, student.id]));

    if (entries.some((entry) => !byExternalId.has(entry.studentExternalId))) {
      throw ApiError.format('', ConductMessages.STUDENT_NOT_FOUND);
    }

    await prisma.$transaction(
      entries.map(({ studentExternalId, behaviour, uniformCleanliness }) => {
        const studentId = byExternalId.get(studentExternalId)!;

        return prisma.studentConduct.upsert({
          where: { studentId_month_year: { studentId, month, year } },
          create: { studentId, month, year, behaviour, uniformCleanliness, createdBy: userExternalId },
          update: { behaviour, uniformCleanliness, deletedAt: null, updatedBy: userExternalId },
        });
      }),
    );

    return {
      keyName: 'classConduct',
      classConduct: { saved: entries.length },
      code: ConductMessages.CONDUCT_UPSERTED_SUCCESSFULLY.code,
      message: ConductMessages.CONDUCT_UPSERTED_SUCCESSFULLY.message,
      success: true,
    };
  }
}

export default new ConductService();
