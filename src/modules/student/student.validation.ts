import { z } from 'zod';

export const createStudentValidation = z.object({
  firstName: z
    .string({
      error: (iss) => (iss.input === undefined ? 'First name is required.' : 'First name should be string.'),
    })
    .min(1, 'First name is required')
    .max(50)
    .transform((v) => v.trim()),

  lastName: z
    .string({
      error: (iss) => (iss.input === undefined ? 'Last name is required.' : 'Last name should be string.'),
    })
    .min(1, 'Last name is required')
    .max(50)
    .transform((v) => v.trim()),
  fatherName: z
    .string({
      error: (iss) => (iss.input === undefined ? 'Father name is required.' : 'Father name should be string.'),
    })
    .min(1, 'Father name is required')
    .max(50)
    .transform((v) => v.trim()),
  rollNumber: z
    .string({
      error: (iss) => (iss.input === undefined ? 'Roll# is required.' : 'Roll# should be string.'),
    })
    .min(1, 'Roll number is required')
    .max(20)
    .transform((v) => v.trim()),
  email: z.string('Email should be string').optional(),

  contactNo: z.string('Contact number should be string').min(7).max(20).optional(),

  classId: z.uuid({
    error: (iss) => (iss.input === undefined ? 'Class Id is required.' : 'Class Id must be a valid UUID.'),
  }),
  electiveSubjectIds: z
    .array(z.uuid('Each Subject Id must be a valid UUID'), 'Subject Ids list is required')
    .min(1, 'At least one subject must be selected')
    .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate Subject Ids are not allowed' })
    .optional(),
});
