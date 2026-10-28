-- Data backfill. Until this release, createStudent skipped subject assignment entirely when the request
-- carried no electiveSubjectIds — and the frontend never sends them — so students added from the UI got no
-- subjects, and the marks-entry sheet (which lists only enrolled students) silently left them out.
-- Gives every live student with NO enrolments the active compulsory subjects of their class. Students with
-- any enrolment are untouched, and electives can't be inferred, so those must still be set by hand.
INSERT INTO "StudentSubject" ("externalId", "studentId", "subjectClassId", "createdAt", "updatedAt", "createdBy")
SELECT gen_random_uuid()::text, s."id", sc."id", CURRENT_TIMESTAMP, CURRENT_TIMESTAMP, 'migration:backfill_compulsory_subjects'
FROM "Student" s
JOIN "SubjectClass" sc ON sc."classId" = s."classId" AND sc."deletedAt" IS NULL
JOIN "Subject" sub ON sub."id" = sc."subjectId"
WHERE s."deletedAt" IS NULL
  AND sub."deletedAt" IS NULL
  AND sub."isActive" = true
  AND sub."subjectType" = 'COMPULSORY'
  AND NOT EXISTS (SELECT 1 FROM "StudentSubject" ss WHERE ss."studentId" = s."id");
