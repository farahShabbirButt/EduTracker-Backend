import { ConductRating } from '@prisma/client';
import { z } from 'zod';

const conductRatingValues = Object.values(ConductRating) as [string, ...string[]];

export const upsertConductValidation = z.object({
  params: z.object({
    studentExternalId: z.uuid('Student external Id is required. Invalid UUID'),
  }),
  body: z.object({
    month: z.number('Valid Month is required between 1 to 12').min(1).max(12),
    year: z.number('Valid Year is required between 2000 to 2100').min(2000).max(2100),
    behaviour: z.enum(conductRatingValues, {
      error: 'Behaviour must be one of EXCELLENT, VERY_GOOD, GOOD, SATISFACTORY, UNSATISFACTORY',
    }),
    uniformCleanliness: z.enum(conductRatingValues, {
      error: 'Uniform & Cleanliness must be one of EXCELLENT, VERY_GOOD, GOOD, SATISFACTORY, UNSATISFACTORY',
    }),
  }),
});

export const getConductValidation = z.object({
  params: z.object({
    studentExternalId: z.uuid('Student external Id is required. Invalid UUID'),
  }),
  query: z.object({
    month: z.coerce.number('Valid Month is required between 1 to 12').min(1).max(12),
    year: z.coerce.number('Valid Year is required between 2000 to 2100').min(2000).max(2100),
  }),
});
