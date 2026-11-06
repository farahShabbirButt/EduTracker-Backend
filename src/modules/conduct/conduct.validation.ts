import { ConductRating } from '@prisma/client';
import { z } from 'zod';

const conductRatingValues = Object.values(ConductRating) as [string, ...string[]];

const classMonth = {
  month: z.coerce.number('Valid Month is required between 1 to 12').int().min(1).max(12),
  year: z.coerce.number('Valid Year is required between 2000 to 2100').int().min(2000).max(2100),
};

export const getClassConductValidation = z.object({
  params: z.object({ classExternalId: z.uuid('Class external Id is required. Invalid UUID') }),
  query: z.object(classMonth),
});

export const saveClassConductValidation = z.object({
  params: z.object({ classExternalId: z.uuid('Class external Id is required. Invalid UUID') }),
  body: z.object({
    ...classMonth,
    entries: z
      .array(
        z.object({
          studentExternalId: z.uuid('Student external Id is required. Invalid UUID'),
          behaviour: z.enum(conductRatingValues, { error: 'Choose a behaviour rating' }),
          uniformCleanliness: z.enum(conductRatingValues, { error: 'Choose a uniform rating' }),
        }),
      )
      .min(1, 'Rate at least one student'),
  }),
});
