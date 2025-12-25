/*
  Warnings:

  - Added the required column `maxMarks` to the `Subject` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subjectType` to the `Subject` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Subject" ADD COLUMN     "maxMarks" INTEGER NOT NULL,
ADD COLUMN     "subjectType" "SubjectType" NOT NULL;
