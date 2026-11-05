import { TestType } from '@prisma/client';
import { z } from 'zod';

const noRepeatedSubject = (subjects: { subjectExternalId: string }[]) =>
  new Set(subjects.map((s) => s.subjectExternalId)).size === subjects.length;
const REPEATED_SUBJECT = { message: 'A subject can only be on a test once' };

export const createTestValidation = z.object({
  body: z.object({
    name: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Test name is required.' : 'First name should be string.'),
      })
      .trim()
      .min(1, 'Test name is required')
      .max(50),

    testType: z.enum([TestType.MONTHLY, TestType.SESSION], {
      error: 'Test Type must be either MONTHLY or SESSION',
    }),

    month: z.number('Valid Month is required between 1 to 12').int().min(1).max(12),
    year: z.number('Valid Year is required between 2000 to 2100').int().min(2000).max(2100),

    totalMarks: z.number('Totals Marks should be a valid number greater than 0').positive(),

    classExternalId: z.uuid('Class external Id is required.Invalid UUID'),

    subjects: z
      .array(
        z.object({
          subjectExternalId: z.uuid('Invalid subject id'),
          maxMarks: z.number('Max marks must be a number').int().positive().max(10000),
        }),
      )
      .min(1, 'A test must include at least one subject')
      .refine(noRepeatedSubject, REPEATED_SUBJECT),
  }),
});

export const setTestSubjectsValidation = z.object({
  params: z.object({
    externalId: z.uuid('Test external Id is required.Invalid UUID'),
  }),
  body: z.object({
    subjects: z
      .array(
        z.object({
          subjectExternalId: z.uuid('Invalid subject id'),
          maxMarks: z.number('Max marks must be a number').int().positive().max(10000),
        }),
      )
      .min(1, 'A test must include at least one subject')
      .refine(noRepeatedSubject, REPEATED_SUBJECT),
  }),
});

export const updateTestValidation = z.object({
  params: z.object({
    externalId: z.uuid('Class external Id is required.Invalid UUID'),
  }),
  body: z.object({
    name: z.string('Test name is required in string').trim().min(1).max(50).optional(),

    testType: z.enum(['MONTHLY', 'SESSION']).optional(),

    month: z.number('Valid Month is required between 1 to 12').int().min(1).max(12).optional(),
    year: z.number('Valid Year is required between 2000 to 2100').int().min(2000).max(2100).optional(),

    totalMarks: z.number('Totals Marks should be a valid number greater than 0').positive().optional(),

    classExternalId: z.uuid('Class is required').optional(),

    subjects: z
      .array(
        z.object({
          subjectExternalId: z.uuid('Invalid subject id'),
          maxMarks: z.number('Max marks must be a number').int().positive().max(10000),
        }),
      )
      .min(1, 'A test must include at least one subject')
      .refine(noRepeatedSubject, REPEATED_SUBJECT)
      .optional(),
  }),
});
export const deleteTestValidation = z.object({
  params: z.object({
    externalId: z.uuid('Class external Id is required.Invalid UUID'),
  }),
});

export const getAllTestValidation = z.object({
  query: z.object({
    classExternalId: z.uuid('Class external Id is required.Invalid UUID').optional(),
    month: z.coerce.number().min(1).max(12).optional(),
    year: z.coerce.number().min(2000).max(2100).optional(),
  }),
});
