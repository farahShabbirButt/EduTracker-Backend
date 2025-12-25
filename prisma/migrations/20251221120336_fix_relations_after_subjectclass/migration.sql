/*
  Warnings:

  - You are about to drop the column `obtainedMarks` on the `StudentScore` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `StudentScore` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `StudentSubject` table. All the data in the column will be lost.
  - You are about to drop the column `classId` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `maxMarks` on the `Subject` table. All the data in the column will be lost.
  - You are about to drop the column `subjectType` on the `Subject` table. All the data in the column will be lost.
  - Added the required column `marksObtained` to the `StudentScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectClassId` to the `StudentScore` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectClassId` to the `StudentSubject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `StudentSubject` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudentScore" DROP CONSTRAINT "StudentScore_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "StudentSubject" DROP CONSTRAINT "StudentSubject_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_classId_fkey";

-- DropIndex
DROP INDEX "StudentScore_studentId_subjectId_testId_key";

-- DropIndex
DROP INDEX "StudentSubject_studentId_subjectId_key";

-- AlterTable
ALTER TABLE "StudentScore" DROP COLUMN "obtainedMarks",
DROP COLUMN "subjectId",
ADD COLUMN     "marksObtained" INTEGER NOT NULL,
ADD COLUMN     "subjectClassId" INTEGER NOT NULL;

-- AlterTable
ALTER TABLE "StudentSubject" DROP COLUMN "subjectId",
ADD COLUMN     "subjectClassId" INTEGER NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Subject" DROP COLUMN "classId",
DROP COLUMN "maxMarks",
DROP COLUMN "subjectType";

-- CreateTable
CREATE TABLE "SubjectClass" (
    "id" SERIAL NOT NULL,
    "externalId" TEXT NOT NULL,
    "subjectId" INTEGER NOT NULL,
    "classId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "SubjectClass_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SubjectClass_externalId_key" ON "SubjectClass"("externalId");

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SubjectClass" ADD CONSTRAINT "SubjectClass_classId_fkey" FOREIGN KEY ("classId") REFERENCES "Class"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentSubject" ADD CONSTRAINT "StudentSubject_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StudentScore" ADD CONSTRAINT "StudentScore_subjectClassId_fkey" FOREIGN KEY ("subjectClassId") REFERENCES "SubjectClass"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
