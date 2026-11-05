import { z } from 'zod';
import { SubjectType } from '@prisma/client';

export const MAX_MARKS_LIMIT = 10000;

export const createSubjectValidation = z.object({
  body: z.object({
    name: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Subject name is required.' : 'Subject name should be string.'),
      })
      .trim()
      .min(2, 'Subject name must be at least 2 characters'),

    subjectType: z.enum([SubjectType.COMPULSORY, SubjectType.ELECTIVE], {
      error: 'Subject Type must be either COMPULSORY or ELECTIVE',
    }),
    maxMarks: z
      .number()
      .int('Max marks must be an integer')
      .positive('Max marks must be greater than 0')
      .max(MAX_MARKS_LIMIT, `Max marks can't be above ${MAX_MARKS_LIMIT}`)
      .refine((value) => value > 0, { message: 'Max marks is required and must be greater than 0' }),

    isActive: z.boolean({ error: 'isActive should be true or false' }).optional(),
  }),
});

export const updateSubjectValidation = z.object({
  body: z
    .object({
      name: z.string().trim().min(2, 'Subject name must be at least 2 characters').optional(),
      subjectType: z
        .enum([SubjectType.COMPULSORY, SubjectType.ELECTIVE], {
          error: 'Subject Type must be either COMPULSORY or ELECTIVE',
        })
        .optional(),
      maxMarks: z
        .number()
        .int({ error: 'Max marks must be an integer' })
        .positive({ error: 'Max marks should be greater than 0' })
        .max(MAX_MARKS_LIMIT, `Max marks can't be above ${MAX_MARKS_LIMIT}`)
        .optional(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field must be provided for update',
    }),
});
export const getAllSubjectVaidation = z.object({
  query: z.object({
    classExternalId: z.uuid('Class Id is required.Invalid UUID').optional(),
  }),
});
