-- The school year's full start date replaces its month. Existing rows keep their month,
-- starting on the 1st of this year.
ALTER TABLE "Institute" ADD COLUMN "schoolYearStartDate" DATE NOT NULL DEFAULT CURRENT_DATE;
UPDATE "Institute"
SET "schoolYearStartDate" = make_date(EXTRACT(YEAR FROM CURRENT_DATE)::int, "schoolYearStartMonth", 1);
ALTER TABLE "Institute" DROP COLUMN "schoolYearStartMonth";

-- The school's logo as a data URL, printed on result cards.
ALTER TABLE "Institute" ADD COLUMN "logo" TEXT;
