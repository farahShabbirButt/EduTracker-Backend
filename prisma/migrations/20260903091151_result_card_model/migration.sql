-- CreateEnum
CREATE TYPE "ConductRating" AS ENUM ('EXCELLENT', 'VERY_GOOD', 'GOOD', 'SATISFACTORY', 'UNSATISFACTORY');

-- CreateTable
CREATE TABLE "TestSubject" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "testId" INTEGER NOT NULL,
    "subjectClassId" INTEGER NOT NULL,
    "maxMarks" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "TestSubject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StudentConduct" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "studentId" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "behaviour" "ConductRating" NOT NULL,
    "uniformCleanliness" "ConductRating" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "StudentConduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Institute" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "Institute_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TestSubject_externalId_key" ON "TestSubject"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "TestSubject_testId_subjectClassId_key" ON "TestSubject"("testId", "subjectClassId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentConduct_externalId_key" ON "StudentConduct"("externalId");

-- CreateIndex
CREATE UNIQUE INDEX "StudentConduct_studentId_month_year_key" ON "StudentConduct"("studentId", "month", "year");

-- CreateIndex
CREATE UNIQUE INDEX "Institute_externalId_key" ON "Institute"("externalId");

-- AddForeignKey
ALTER TABLE "TestSubject" ADD CONSTRAINT "TestSubject_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestSubject" ADD CONSTRAINT "TestSubject_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentConduct" ADD CONSTRAINT "StudentConduct_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Backfill TestSubject from existing StudentScore rows, BEFORE StudentScore itself is touched.
-- Every distinct (testId, subjectClassId) pair that currently has a score gets a TestSubject row,
-- defaulting maxMarks to the subject's existing global maxMarks (or 100 if that is somehow null).
INSERT INTO edu_tracker."TestSubject" ("externalId", "testId", "subjectClassId", "maxMarks", "createdAt", "updatedAt")
SELECT gen_random_uuid(), ss."testId", ss."subjectClassId", COALESCE(sub."maxMarks", 100), now(), now()
FROM (SELECT DISTINCT "testId", "subjectClassId" FROM edu_tracker."StudentScore") ss
JOIN edu_tracker."SubjectClass" sc ON sc.id = ss."subjectClassId"
JOIN edu_tracker."Subject" sub ON sub.id = sc."subjectId";

-- Add the new column as nullable first, populate it from the freshly backfilled TestSubject rows,
-- then enforce NOT NULL only once every existing row has a value.
ALTER TABLE edu_tracker."StudentScore" ADD COLUMN "testSubjectId" INTEGER;

UPDATE edu_tracker."StudentScore" ss
SET "testSubjectId" = ts.id
FROM edu_tracker."TestSubject" ts
WHERE ts."testId" = ss."testId" AND ts."subjectClassId" = ss."subjectClassId";

ALTER TABLE edu_tracker."StudentScore" ALTER COLUMN "testSubjectId" SET NOT NULL;

-- Only now that every row has been repointed to testSubjectId, drop the old columns and their FKs.
ALTER TABLE edu_tracker."StudentScore" DROP CONSTRAINT IF EXISTS "StudentScore_testId_fkey";
ALTER TABLE edu_tracker."StudentScore" DROP CONSTRAINT IF EXISTS "StudentScore_subjectClassId_fkey";
ALTER TABLE edu_tracker."StudentScore" DROP COLUMN "testId";
ALTER TABLE edu_tracker."StudentScore" DROP COLUMN "subjectClassId";

-- AddForeignKey
ALTER TABLE edu_tracker."StudentScore"
  ADD CONSTRAINT "StudentScore_testSubjectId_fkey"
  FOREIGN KEY ("testSubjectId") REFERENCES edu_tracker."TestSubject"(id) ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateIndex
CREATE UNIQUE INDEX "StudentScore_studentId_testSubjectId_key"
  ON edu_tracker."StudentScore"("studentId", "testSubjectId");
