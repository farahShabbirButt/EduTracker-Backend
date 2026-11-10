import { z } from 'zod';

const gridIds = {
  classExternalId: z.uuid('Class Id is required.Invalid UUID'),
  testExternalId: z.uuid('Test Id is required.Invalid UUID'),
};

export const getMarksGridValidation = z.object({
  query: z.object(gridIds),
});

export const saveMarksGridValidation = z.object({
  body: z.object({
    ...gridIds,
    marks: z
      .array(
        z.object({
          studentExternalId: z.uuid('Student Id is required.Invalid UUID'),
          subjectExternalId: z.uuid('Subject Id is required.Invalid UUID'),
          // null clears a saved mark
          marksObtained: z
            .number('Obtained marks should be number greater than 0')
            .min(0, 'Marks cannot be negative')
            .multipleOf(0.5, 'Marks must be whole or half numbers')
            .nullable(),
        }),
      )
      .min(1, 'There are no marks to save'),
  }),
});
