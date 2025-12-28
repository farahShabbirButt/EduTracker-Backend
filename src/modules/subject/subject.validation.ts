import { z } from 'zod';
import { SubjectType } from '@prisma/client';

export const createSubjectValidation = z.object({
  name: z
    .string()
    .min(2, 'Subject name must be at least 2 characters')
    .transform((v) => v.trim()),

  subjectType: z.enum([SubjectType.COMPULSORY, SubjectType.ELECTIVE]),
  maxMarks: z.number().int('Max marks must be an integer').positive('Max marks must be greater than 0'),

  isActive: z.boolean().optional(),

  createdBy: z.string().min(1).optional(),
});

export const updateSubjectValidation = z
  .object({
    name: z
      .string()
      .min(2)
      .transform((v) => v.trim())
      .optional(),
    subjectType: z.enum([SubjectType.COMPULSORY, SubjectType.ELECTIVE]),
    maxMarks: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
    updatedBy: z.string().min(1).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });
