import { z } from 'zod';

export const createStudentValidation = z.object({
  body: z.object({
    firstName: z
      .string({
        error: (iss) => (iss.input === undefined ? 'First name is required.' : 'First name should be string.'),
      })
      .trim()
      .min(1, 'First name is required')
      .max(50),

    // Optional: many students have no last name (the school's own cards read e.g. "Qasim s/o Amjad").
    // Stored as '' because the column is non-null; the report trims the joined name.
    lastName: z
      .string('Last name should be string.')
      .max(50, 'Last name must be at most 50 characters')
      .transform((v) => v.trim())
      .default(''),
    fatherName: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Father name is required.' : 'Father name should be string.'),
      })
      .trim()
      .min(1, 'Father name is required')
      .max(50),
    rollNumber: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Roll# is required.' : 'Roll# should be string.'),
      })
      .trim()
      .min(1, 'Roll number is required')
      .max(20),
    email: z.string('Email should be string').optional(),

    contactNo: z.string('Contact number should be string').min(7).max(20).optional(),

    classId: z.uuid({
      error: (iss) => (iss.input === undefined ? 'Class Id is required.' : 'Class Id must be a valid UUID.'),
    }),
    electiveSubjectIds: z
      .array(z.uuid('Each Subject Id must be a valid UUID'), 'Subject Ids list is required')
      .refine((ids) => new Set(ids).size === ids.length, { message: 'Duplicate Subject Ids are not allowed' })
      .optional(),
  }),
});
export const updateStudentValidation = z.object({
  params: z.object({
    studentExternalId: z.uuid('Invalid student id'),
  }),
  body: z.object({
    firstName: z.string().trim().min(1).max(50).optional(),
    lastName: z.string().trim().max(50).optional(), // may be '' to clear it
    fatherName: z.string().trim().min(1).max(50).optional(),

    email: z.string().email().optional(),
    contactNo: z.string().min(7).max(20).optional(),

    electiveSubjectIds: z.array(z.string().uuid()).optional(),

    classId: z.string().uuid().optional(),
  }),
});
export const deleteStudentValidation = z.object({
  params: z.object({
    studentExternalId: z.uuid('Invalid student id'),
  }),
});
