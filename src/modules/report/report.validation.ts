import { z } from 'zod';

const month = z.coerce.number('Valid Month is required between 1 to 12').int().min(1).max(12);
const year = z.coerce.number('Valid Year is required between 2000 to 2100').int().min(2000).max(2100);

export const getStudentReportValidation = z.object({
  params: z.object({
    studentExternalId: z.uuid('Student external Id is required. Invalid UUID'),
  }),
  query: z
    .object({
      mode: z.enum(['MONTHLY'], {
        error: 'mode must be MONTHLY - SESSION reports are not supported yet',
      }),
      fromMonth: month,
      fromYear: year,
      toMonth: month,
      toYear: year,
    })
    .refine((q) => q.fromYear * 12 + q.fromMonth <= q.toYear * 12 + q.toMonth, {
      message: 'The period must end after it starts',
    }),
});
