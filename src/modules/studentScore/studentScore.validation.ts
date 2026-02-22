import { z } from 'zod';

export const marksEntryValidation = z.object({
  body: z.object({
    classExternalId: z.uuid('Class Id is required.Invalid UUID'),
    testExternalId: z.uuid('Test Id is required.Invalid UUID'),
    subjectExternalId: z.uuid('Subject Id is required.Invalid UUID'),

    scores: z.array(
      z.object({
        studentExternalId: z.uuid('Student Id is required.Invalid UUID'),
        marksObtained: z.number('Obtained marks should be number greater than 0').min(0),
      }),
    ),
  }),
});
export const getMarksEntryStudentsVaidation = z.object({
  query: z.object({
    classExternalId: z.uuid('Class Id is required.Invalid UUID'),
    testExternalId: z.uuid('Test Id is required.Invalid UUID'),
    subjectExternalId: z.uuid('Subject Id is required.Invalid UUID'),
  }),
});
