/*
  Warnings:

  - A unique constraint covering the columns `[classId,month,year,testType]` on the table `Test` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Test" ADD COLUMN     "month" INTEGER,
ADD COLUMN     "year" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Test_classId_month_year_testType_key" ON "Test"("classId", "month", "year", "testType");
