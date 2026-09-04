// Reproduces the school's real historical result card (eduTrackerDocs/Sample_result_card.xlsx)
// as live data, so the report endpoint's output can be diffed against the spreadsheet the
// school has printed from for years. This is the proof that the arithmetic is correct — not
// just that the endpoint doesn't crash.
//
// Standalone script — run with `npx tsx prisma/fixtures/sampleCard.ts`. Deliberately NOT wired
// into `prisma db seed`; it must never run automatically.
//
// Idempotent and self-scoped: everything it creates hangs off one dedicated class named
// CLASS_NAME below. Each run deletes only that class's own data (found by walking its
// foreign keys) before recreating it, so it can never collide with, or be mistaken for, the
// school's real classes/students.
import { PrismaClient, SubjectType, TestType } from "@prisma/client";

const prisma = new PrismaClient();

const CLASS_NAME = "PLAN FIXTURE 9th";
const YEAR = 2026;

// Column order and per-test max marks, transcribed verbatim from the spreadsheet.
const SUBJECTS = [
    { name: "Maths", maxMarks: 30 },
    { name: "Urdu", maxMarks: 50 },
    { name: "English", maxMarks: 60 },
    { name: "Al Quran", maxMarks: 30 },
    { name: "Islamiat", maxMarks: 30 },
    { name: "Bio/com", maxMarks: 30 },
    { name: "Physics", maxMarks: 30 },
    { name: "Chemistry", maxMarks: 30 },
];

// One row per test, marks in the same column order as SUBJECTS above. `null` means the
// subject was not examined on that test — Test 8 drops Al Quran and Islamiat entirely, which
// is the case this whole fixture exists to pin: a naive implementation still divides by the
// full 290-mark denominator instead of the true 230.
const TEST_MARKS = [
    [28, 47, 54, 30, 30, 28, 29, 28], // Test 1
    [22, 47, 58, 30, 30, 27, 27, 22], // Test 2
    [23, 42, 54, 30, 30, 29, 26, 25], // Test 3
    [29, 47, 58, 30, 30, 24, 28, 27], // Test 4
    [28, 41, 57, 30, 29, 24, 27, 28], // Test 5
    [26, 36, 56, 30, 29, 20, 26, 30], // Test 6
    [27, 44, 54, 30, 29, 26, 28, 29], // Test 7
    [26, 40, 58, null, null, 26, 22, 29], // Test 8 — no Al Quran, no Islamiat
];

// Hard-deletes this fixture's own rows only, walked outward from its dedicated class via FK,
// so a stale run never lingers as an orphaned duplicate class on the next run. Every FK in
// this schema is ON DELETE RESTRICT, so children must go before parents.
async function deleteExistingFixture() {
    const existingClass = await prisma.class.findFirst({
        where: { name: CLASS_NAME },
    });
    if (!existingClass) {
        return;
    }

    const classId = existingClass.id;

    const students = await prisma.student.findMany({
        where: { classId },
        select: { id: true },
    });
    const studentIds = students.map((s) => s.id);

    const tests = await prisma.test.findMany({
        where: { classId },
        select: { id: true },
    });
    const testIds = tests.map((t) => t.id);

    const testSubjects = testIds.length
        ? await prisma.testSubject.findMany({
              where: { testId: { in: testIds } },
              select: { id: true },
          })
        : [];
    const testSubjectIds = testSubjects.map((ts) => ts.id);

    const subjectClasses = await prisma.subjectClass.findMany({
        where: { classId },
        select: { id: true, subjectId: true },
    });
    const subjectClassIds = subjectClasses.map((sc) => sc.id);
    const subjectIds = subjectClasses.map((sc) => sc.subjectId);

    if (testSubjectIds.length) {
        await prisma.studentScore.deleteMany({
            where: { testSubjectId: { in: testSubjectIds } },
        });
    }
    if (studentIds.length) {
        await prisma.studentConduct.deleteMany({
            where: { studentId: { in: studentIds } },
        });
        await prisma.studentSubject.deleteMany({
            where: { studentId: { in: studentIds } },
        });
    }
    if (testSubjectIds.length) {
        await prisma.testSubject.deleteMany({
            where: { id: { in: testSubjectIds } },
        });
    }
    if (testIds.length) {
        await prisma.test.deleteMany({ where: { id: { in: testIds } } });
    }
    if (subjectClassIds.length) {
        await prisma.subjectClass.deleteMany({
            where: { id: { in: subjectClassIds } },
        });
    }
    if (studentIds.length) {
        await prisma.student.deleteMany({ where: { id: { in: studentIds } } });
    }
    if (subjectIds.length) {
        await prisma.subject.deleteMany({ where: { id: { in: subjectIds } } });
    }
    await prisma.class.delete({ where: { id: classId } });

    console.info(`🧹 Removed previous "${CLASS_NAME}" fixture data`);
}

async function createFixture() {
    const createdClass = await prisma.class.create({
        data: { name: CLASS_NAME },
    });

    const createdSubjects = [];
    for (const s of SUBJECTS) {
        const subject = await prisma.subject.create({
            data: {
                name: s.name,
                subjectType: SubjectType.COMPULSORY,
                maxMarks: s.maxMarks,
            },
        });
        createdSubjects.push(subject);
    }

    const subjectClasses = [];
    for (const subject of createdSubjects) {
        const subjectClass = await prisma.subjectClass.create({
            data: { subjectId: subject.id, classId: createdClass.id },
        });
        subjectClasses.push(subjectClass);
    }

    const student = await prisma.student.create({
        data: {
            firstName: "Qasim",
            lastName: "",
            fatherName: "Amjad",
            rollNumber: "615872",
            classId: createdClass.id,
        },
    });

    for (let i = 0; i < TEST_MARKS.length; i++) {
        const testNumber = i + 1;
        const rowMarks = TEST_MARKS[i];

        const examinedIndices = rowMarks
            .map((mark, idx) => (mark === null ? -1 : idx))
            .filter((idx) => idx !== -1);

        const totalMarks = examinedIndices.reduce(
            (sum, idx) => sum + SUBJECTS[idx].maxMarks,
            0
        );

        const test = await prisma.test.create({
            data: {
                name: `Test ${testNumber}`,
                testType: TestType.MONTHLY,
                month: testNumber,
                year: YEAR,
                totalMarks,
                classId: createdClass.id,
            },
        });

        for (const idx of examinedIndices) {
            const testSubject = await prisma.testSubject.create({
                data: {
                    testId: test.id,
                    subjectClassId: subjectClasses[idx].id,
                    maxMarks: SUBJECTS[idx].maxMarks,
                },
            });

            await prisma.studentScore.create({
                data: {
                    studentId: student.id,
                    testSubjectId: testSubject.id,
                    marksObtained: rowMarks[idx],
                },
            });
        }
    }

    return student;
}

async function main() {
    await deleteExistingFixture();
    const student = await createFixture();
    console.info(
        `✅ Sample card fixture created — student externalId: ${student.externalId}`
    );
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
