/*
  Warnings:

  - A unique constraint covering the columns `[classId,name,month,year,testType]` on the table `Test` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Test_classId_month_year_testType_key";

-- CreateIndex
CREATE UNIQUE INDEX "Test_classId_name_month_year_testType_key" ON "Test"("classId", "name", "month", "year", "testType");
