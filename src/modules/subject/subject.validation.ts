import { z } from 'zod';
import { SubjectType } from '@prisma/client';

export const createSubjectValidation = z.object({
  name: z
    .string({
      error: (iss) => (iss.input === undefined ? 'Subject name is required.' : 'Subject name should be string.'),
    })
    .min(2, 'Subject name must be at least 2 characters')
    .transform((v) => v.trim())
    .refine((value) => value.length > 0, { error: 'Subject name is required' }),

  subjectType: z.enum([SubjectType.COMPULSORY, SubjectType.ELECTIVE], {
    error: 'Subject Type must be either COMPULSORY or ELECTIVE',
  }),
  maxMarks: z
    .number()
    .int('Max marks must be an integer')
    .positive('Max marks must be greater than 0')
    .refine((value) => value > 0, { message: 'Max marks is required and must be greater than 0' }),

  isActive: z.boolean({ error: 'isActive should be true or false' }).optional(),
  createdBy: z.string().min(1).optional(),
});

export const updateSubjectValidation = z
  .object({
    name: z
      .string()
      .min(2, 'Subject name must be at least 2 characters')
      .transform((v) => v.trim())
      .optional(),
    subjectType: z
      .enum([SubjectType.COMPULSORY, SubjectType.ELECTIVE], {
        error: 'Subject Type must be either COMPULSORY or ELECTIVE',
      })
      .optional(),
    maxMarks: z
      .number()
      .int({ error: 'Max marks must be an integer' })
      .positive({ error: 'Max marks should be greater than 0' })
      .optional(),
    isActive: z.boolean({ error: 'isActive should be true or false' }).optional(),
    updatedBy: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
