import prisma, { LIVE_SCORES } from './prisma.js';

// Which marks a student owes, shared by the card, the marks grid, the tests list and the dashboard.

export const monthIndex = ({ month, year }: { month: number; year: number }): number => year * 12 + month;
export const joinedMonthIndex = (date: Date): number =>
  monthIndex({ month: date.getMonth() + 1, year: date.getFullYear() });

// A test from before the student joined the class isn't theirs to sit, unless they have a mark
// on it. The month is all a test records, so a test in the joining month counts.
export const owesTest = (classSince: Date, test: { month: number; year: number }, hasMarkOnTest: boolean): boolean =>
  hasMarkOnTest || monthIndex(test) >= joinedMonthIndex(classSince);

export interface ITestProgress {
  entered: number;
  expected: number;
  // Students owing marks who have none on this test at all
  blankStudents: { firstName: string; lastName: string | null }[];
}

export async function getTestProgress(testIds: number[]): Promise<Map<number, ITestProgress>> {
  const tests = await prisma.test.findMany({
    where: { id: { in: testIds } },
    select: {
      id: true,
      classId: true,
      month: true,
      year: true,
      testSubjects: {
        where: { deletedAt: null },
        select: {
          subjectClass: { select: { subjectId: true } },
          scores: { where: LIVE_SCORES, select: { studentId: true } },
        },
      },
    },
  });

  const students = await prisma.student.findMany({
    where: { classId: { in: tests.map((test) => test.classId) }, isActive: true, deletedAt: null },
    select: {
      id: true,
      classId: true,
      classSince: true,
      firstName: true,
      lastName: true,
      studentSubjects: { select: { subjectClass: { select: { subjectId: true } } } },
    },
  });

  const progress = new Map<number, ITestProgress>();

  for (const test of tests) {
    const result: ITestProgress = { entered: 0, expected: 0, blankStudents: [] };

    for (const student of students.filter((s) => s.classId === test.classId)) {
      const taken = new Set(student.studentSubjects.map((ss) => ss.subjectClass.subjectId));
      const theirs = test.testSubjects.filter((ts) => taken.has(ts.subjectClass.subjectId));
      const hasMarkOnTest = test.testSubjects.some((ts) => ts.scores.some((s) => s.studentId === student.id));

      if (theirs.length === 0 || !owesTest(student.classSince, test, hasMarkOnTest)) {
        continue;
      }

      result.expected += theirs.length;
      result.entered += theirs.filter((ts) => ts.scores.some((s) => s.studentId === student.id)).length;

      if (!hasMarkOnTest) {
        result.blankStudents.push({ firstName: student.firstName, lastName: student.lastName });
      }
    }

    progress.set(test.id, result);
  }

  return progress;
}
