-- The day a session test was sat. Monthly tests keep only their month and year.
ALTER TABLE "Test" ADD COLUMN "testDate" DATE;
