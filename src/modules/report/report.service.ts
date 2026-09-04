import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { GradeService } from '../grade/index.js';
import { IReportCard, IReportCardPosition, IReportCardRow, ReportMessages, ReportMode } from './index.js';

const round2 = (value: number): number => Math.round(value * 100) / 100;

const testSubjectKey = (testId: number, subjectClassId: number): string => `${testId}:${subjectClassId}`;

class ReportService {
  async getStudentReport(studentExternalId: string, mode: ReportMode, year: number): Promise<IAPISuccessResponse> {
    const student = await prisma.student.findUnique({
      where: { externalId: studentExternalId, isActive: true, deletedAt: null },
      include: { class: true },
    });

    if (!student) {
      throw ApiError.format('', ReportMessages.STUDENT_NOT_FOUND);
    }

    const institute = await prisma.institute.findFirst({ where: { deletedAt: null } });

    if (!institute) {
      throw ApiError.format('', ReportMessages.INSTITUTE_NOT_CONFIGURED);
    }

    const tests = await prisma.test.findMany({
      where: { classId: student.classId, testType: 'MONTHLY', year, isActive: true, deletedAt: null },
      orderBy: [{ month: 'asc' }, { id: 'asc' }],
    });

    const testIds = tests.map((test) => test.id);

    const testSubjects = testIds.length
      ? await prisma.testSubject.findMany({
          where: { testId: { in: testIds }, deletedAt: null },
          include: { subjectClass: { include: { subject: true } } },
        })
      : [];

    // Columns come from what the tests actually examined, not from the class's current
    // active SubjectClass list. A card for a past year must keep showing a subject the
    // student sat even if that SubjectClass has since been soft-deleted from the class —
    // otherwise its TestSubject (and every score attached to it) silently vanishes from
    // the printed record. Dedupe by subjectClassId, sorted ascending for a stable column
    // order shared by every student in the class.
    const subjectClassById = new Map<number, (typeof testSubjects)[number]['subjectClass']>();
    for (const ts of testSubjects) {
      if (!subjectClassById.has(ts.subjectClassId)) {
        subjectClassById.set(ts.subjectClassId, ts.subjectClass);
      }
    }
    const subjectClasses = Array.from(subjectClassById.values()).sort((a, b) => a.id - b.id);

    const testSubjectByKey = new Map(testSubjects.map((ts) => [testSubjectKey(ts.testId, ts.subjectClassId), ts]));
    const testSubjectIds = testSubjects.map((ts) => ts.id);

    const scores = testSubjectIds.length
      ? await prisma.studentScore.findMany({
          where: { studentId: student.id, testSubjectId: { in: testSubjectIds }, deletedAt: null },
        })
      : [];

    const scoreByTestSubjectId = new Map(scores.map((score) => [score.testSubjectId, score.marksObtained]));

    const rows: IReportCardRow[] = [];

    for (const test of tests) {
      const marks: Record<string, { obtained: number; max: number }> = {};
      let total = 0;
      let maxTotal = 0;

      for (const subjectClass of subjectClasses) {
        const testSubject = testSubjectByKey.get(testSubjectKey(test.id, subjectClass.id));

        // No TestSubject row for this (test, subject) pair means the subject was not
        // examined in this test — omit the key entirely so the card renders a blank cell.
        if (!testSubject) {
          continue;
        }

        const obtained = scoreByTestSubjectId.get(testSubject.id) ?? 0;
        marks[subjectClass.subject.externalId] = { obtained, max: testSubject.maxMarks };
        total += obtained;
        maxTotal += testSubject.maxMarks;
      }

      const percentage = maxTotal ? round2((total / maxTotal) * 100) : 0;
      const { grade } = await GradeService.resolveGradeForPercentage(percentage);

      rows.push({ testName: test.name, marks, total, maxTotal, percentage, grade });
    }

    const subjectTotals: Record<string, { obtained: number; max: number }> = {};

    for (const subjectClass of subjectClasses) {
      const key = subjectClass.subject.externalId;
      let obtained = 0;
      let max = 0;

      for (const row of rows) {
        const cell = row.marks[key];
        if (cell) {
          obtained += cell.obtained;
          max += cell.max;
        }
      }

      subjectTotals[key] = { obtained, max };
    }

    const obtainedMarks = rows.reduce((sum, row) => sum + row.total, 0);
    const totalMarks = rows.reduce((sum, row) => sum + row.maxTotal, 0);
    const overallPercentage = totalMarks ? round2((obtainedMarks / totalMarks) * 100) : 0;
    const { grade: overallGrade, remarks } = await GradeService.resolveGradeForPercentage(overallPercentage);
    const status: 'PASS' | 'FAIL' = overallGrade === 'F' ? 'FAIL' : 'PASS';

    // A monthly card spans the whole year while conduct is recorded per month — take the
    // most recent month's conduct within the requested year as the card's snapshot.
    const conductRow = await prisma.studentConduct.findFirst({
      where: { studentId: student.id, year, deletedAt: null },
      orderBy: [{ month: 'desc' }, { id: 'desc' }],
    });

    const position = await this.computePosition(student.id, student.classId, testSubjectIds, totalMarks);

    const report: IReportCard = {
      institute: { name: institute.name, address: institute.address, phone: institute.phone },
      student: {
        name: `${student.firstName} ${student.lastName}`.trim(),
        fatherName: student.fatherName,
        class: student.class.name,
        rollNumber: student.rollNumber,
      },
      title: mode === 'MONTHLY' ? 'MONTHLY ASSESSMENT REPORT' : 'ASSESSMENT REPORT',
      subjects: subjectClasses.map((sc) => ({ externalId: sc.subject.externalId, name: sc.subject.name })),
      rows,
      subjectTotals,
      overall: {
        obtainedMarks,
        totalMarks,
        percentage: overallPercentage,
        grade: overallGrade,
        status,
        remarks,
      },
      conduct: {
        behaviour: conductRow?.behaviour ?? null,
        uniformCleanliness: conductRow?.uniformCleanliness ?? null,
      },
      position,
    };

    return {
      keyName: 'report',
      report,
      code: ReportMessages.REPORT_FETCHED_SUCCESSFULLY.code,
      message: ReportMessages.REPORT_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  // Ranks every active student in the class against the same set of TestSubjects (the same
  // tests, same denominator, regardless of which electives each student actually takes — see
  // the row-building rule above). With no other students to compare against, or no marks
  // configured for the year at all, a ranking is meaningless, so we return null rather than
  // a trivial "1 of 1" / all-tied position.
  private async computePosition(
    studentId: number,
    classId: number,
    testSubjectIds: number[],
    totalMarks: number,
  ): Promise<IReportCardPosition | null> {
    const classmates = await prisma.student.findMany({
      where: { classId, isActive: true, deletedAt: null },
      select: { id: true },
    });

    if (classmates.length <= 1 || totalMarks === 0) {
      return null;
    }

    const allScores = testSubjectIds.length
      ? await prisma.studentScore.findMany({
          where: {
            studentId: { in: classmates.map((c) => c.id) },
            testSubjectId: { in: testSubjectIds },
            deletedAt: null,
          },
        })
      : [];

    const obtainedByStudentId = new Map<number, number>(classmates.map((c) => [c.id, 0]));

    for (const score of allScores) {
      obtainedByStudentId.set(score.studentId, (obtainedByStudentId.get(score.studentId) ?? 0) + score.marksObtained);
    }

    const ranked = classmates
      .map((c) => ({
        studentId: c.id,
        percentage: round2(((obtainedByStudentId.get(c.id) ?? 0) / totalMarks) * 100),
      }))
      .sort((a, b) => b.percentage - a.percentage);

    let rank = 0;
    let previousPercentage: number | null = null;
    const rankByStudentId = new Map<number, number>();

    for (const entry of ranked) {
      if (previousPercentage === null || entry.percentage < previousPercentage) {
        rank += 1;
        previousPercentage = entry.percentage;
      }
      rankByStudentId.set(entry.studentId, rank);
    }

    return { rank: rankByStudentId.get(studentId)!, outOf: classmates.length };
  }
}

export default new ReportService();
