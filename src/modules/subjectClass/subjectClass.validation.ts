import { z } from 'zod';

export const assignSubjectsToClassValidation = z.object({
  classId: z
    .uuid({
      error: (iss) => (iss.input === undefined ? 'Class Id is required.' : 'Class Id must be a valid UUID.'),
    })
    .transform((v) => v.trim()),

  subjectIds: z
    .array(z.string().uuid('Each Subject Id must be a valid UUID'), 'Subject Ids list is required')
    .min(1, 'At least one subject must be selected')
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate Subject Ids are not allowed' }),
});
