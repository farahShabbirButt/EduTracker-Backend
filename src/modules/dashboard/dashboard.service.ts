import prisma from '../../lib/prisma.js';
import { getTestProgress } from '../../lib/marksDue.js';
import { DashboardMessages, IAttentionItem } from './index.js';

// Enough to act on: the rest appear as these are fixed
const MAX_BLANK_STUDENTS = 3;
const MAX_ATTENTION = 12;

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

class DashboardService {
  async getDashboard(): Promise<IAPISuccessResponse> {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    const live = { isActive: true, deletedAt: null };

    const [students, classes, subjects, gradeBands, assignments, tests] = await Promise.all([
      prisma.student.count({ where: live }),
      prisma.class.findMany({
        where: live,
        select: {
          id: true,
          externalId: true,
          name: true,
          _count: { select: { subjectClasses: { where: { deletedAt: null } } } },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.subject.count({ where: live }),
      prisma.gradeScale.count({ where: { deletedAt: null } }),
      prisma.subjectClass.count({ where: { deletedAt: null } }),
      prisma.test.findMany({
        where: { ...live, month, year, testType: 'MONTHLY', class: { deletedAt: null } },
        select: {
          id: true,
          externalId: true,
          name: true,
          classId: true,
          class: { select: { externalId: true, name: true } },
        },
        orderBy: [{ class: { name: 'asc' } }, { id: 'desc' }],
      }),
    ]);

    const progress = await getTestProgress(tests.map((test) => test.id));

    const attention: IAttentionItem[] = [];

    for (const test of tests) {
      const result = progress.get(test.id);
      const missing = result ? result.expected - result.entered : 0;
      const where = {
        detail: `${test.name}, ${test.class.name}`,
        link: 'marks' as const,
        classExternalId: test.class.externalId,
        testExternalId: test.externalId,
      };

      result?.blankStudents.slice(0, MAX_BLANK_STUDENTS).forEach((student) => {
        const name = [student.firstName, student.lastName].filter(Boolean).join(' ');
        attention.push({ title: `${name} has no marks`, ...where });
      });

      if (missing > 0) {
        attention.push({ title: `${plural(missing, 'mark')} still missing`, ...where });
      }
    }

    // Conduct is owed by the classes being tested this month
    const testedClasses = [...new Map(tests.map((test) => [test.classId, test.class])).entries()];
    const unrated = await Promise.all(
      testedClasses.map(([classId]) =>
        prisma.student.count({
          where: { ...live, classId, conducts: { none: { month, year, deletedAt: null } } },
        }),
      ),
    );
    testedClasses.forEach(([, classRef], index) => {
      if (unrated[index] > 0) {
        attention.push({
          title: 'Conduct not rated',
          detail: `${classRef.name}, ${plural(unrated[index], 'student')}`,
          link: 'conduct',
          classExternalId: classRef.externalId,
        });
      }
    });

    classes
      .filter((classRow) => classRow._count.subjectClasses === 0)
      .forEach((classRow) => {
        attention.push({ title: 'No subjects assigned', detail: classRow.name, link: 'subjects' });
      });

    if (gradeBands === 0) {
      attention.push({ title: 'No grade boundaries set', detail: 'Cards need them to print', link: 'grades' });
    }

    const totals = tests.reduce(
      (sum, test) => {
        const result = progress.get(test.id);
        return { entered: sum.entered + (result?.entered ?? 0), expected: sum.expected + (result?.expected ?? 0) };
      },
      { entered: 0, expected: 0 },
    );

    return {
      keyName: 'dashboard',
      dashboard: {
        month,
        year,
        counts: { students, classes: classes.length, subjects, testsThisMonth: tests.length },
        marks: totals,
        tests: tests.map((test) => ({
          externalId: test.externalId,
          name: test.name,
          class: test.class,
          entered: progress.get(test.id)?.entered ?? 0,
          expected: progress.get(test.id)?.expected ?? 0,
        })),
        attention: attention.slice(0, MAX_ATTENTION),
        setup: {
          classes: classes.length > 0,
          subjects: assignments > 0,
          students: students > 0,
          gradeBands: gradeBands > 0,
        },
      },
      code: DashboardMessages.DASHBOARD_FETCHED_SUCCESSFULLY.code,
      message: DashboardMessages.DASHBOARD_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }
}

export default new DashboardService();
