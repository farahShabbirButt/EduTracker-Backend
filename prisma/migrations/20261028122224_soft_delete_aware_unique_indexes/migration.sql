-- Uniqueness that ignores soft-deleted rows ("deletedAt" IS NOT NULL), so deleting a record frees its
-- name / roll number for reuse while two live records can still never clash. Partial indexes can't be
-- declared in schema.prisma, so these exist only here — see the note on the Student model.

-- DropIndex: the old full unique also counted soft-deleted students, blocking roll-number reuse
DROP INDEX "Student_classId_rollNumber_key";

-- CreateIndex
CREATE UNIQUE INDEX "Student_classId_rollNumber_active_key" ON "Student"("classId", "rollNumber") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Class_name_active_key" ON "Class"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Subject_name_active_key" ON "Subject"("name") WHERE "deletedAt" IS NULL;

-- CreateIndex: replaces "Test_classId_name_month_year_testType_key", dropped in 20260215091241_remove_db_constraint
CREATE UNIQUE INDEX "Test_classId_name_month_year_testType_active_key" ON "Test"("classId", "name", "month", "year", "testType") WHERE "deletedAt" IS NULL;
