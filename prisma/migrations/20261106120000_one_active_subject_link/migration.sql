-- One live link per class and subject: partial, because a removed link stays as a soft-deleted
-- row. Prisma can't declare that, so it lives only here, like soft_delete_aware_unique_indexes.
CREATE UNIQUE INDEX "SubjectClass_class_subject_live"
  ON "SubjectClass" ("classId", "subjectId")
  WHERE "deletedAt" IS NULL;

-- One enrolment per student and link. Declared with @@unique in schema.prisma.
CREATE UNIQUE INDEX "StudentSubject_student_link"
  ON "StudentSubject" ("studentId", "subjectClassId");
