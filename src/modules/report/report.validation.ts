import { z } from 'zod';

const month = z.coerce.number('Valid Month is required between 1 to 12').int().min(1).max(12);
const year = z.coerce.number('Valid Year is required between 2000 to 2100').int().min(2000).max(2100);

const params = z.object({
  studentExternalId: z.uuid('Student external Id is required. Invalid UUID'),
});

// A card is monthly tests over months, or one class's session tests from one test to another
const monthlyQuery = z
  .object({
    mode: z.literal('MONTHLY'),
    fromMonth: month,
    fromYear: year,
    toMonth: month,
    toYear: year,
  })
  .refine((q) => q.fromYear * 12 + q.fromMonth <= q.toYear * 12 + q.toMonth, {
    message: 'The period must end after it starts',
  });

const sessionQuery = z.object({
  mode: z.literal('SESSION'),
  fromTestExternalId: z.uuid('Pick the first test of the range'),
  toTestExternalId: z.uuid('Pick the last test of the range'),
  // Earlier tests of the school year, added up as the card's first row
  earlierAsRow: z.enum(['true', 'false']).optional(),
});

export const getStudentReportValidation = z.object({
  params,
  query: z.discriminatedUnion('mode', [monthlyQuery, sessionQuery], {
    error: 'mode must be MONTHLY or SESSION',
  }),
});
