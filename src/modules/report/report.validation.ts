import { z } from 'zod';

export const getStudentReportValidation = z.object({
  params: z.object({
    studentExternalId: z.uuid('Student external Id is required. Invalid UUID'),
  }),
  query: z.object({
    mode: z.enum(['MONTHLY'], {
      error: 'mode must be MONTHLY - SESSION reports are not supported yet',
    }),
    year: z.coerce.number('Valid Year is required between 2000 to 2100').min(2000).max(2100),
  }),
});
