-- When the student joined their current class. Tests from before it aren't owed.
ALTER TABLE "Student" ADD COLUMN "classSince" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Student" SET "classSince" = "createdAt";
