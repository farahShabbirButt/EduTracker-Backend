import { TestType } from '@prisma/client';
import { z } from 'zod';

export const createTestValidation = z.object({
  body: z.object({
    name: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Test name is required.' : 'First name should be string.'),
      })
      .min(1, 'Test name is required')
      .max(50)
      .transform((v) => v.trim()),

    testType: z.enum([TestType.MONTHLY, TestType.SESSION], {
      error: 'Test Type must be either MONTHLY or SESSION',
    }),

    month: z.number('Valid Month is required between 1 to 12').min(1).max(12),
    year: z.number('Valid Year is required between 2000 to 2100').min(2000).max(2100),

    totalMarks: z.number('Totals Marks should be a valid number greater than 0').positive(),

    classExternalId: z.uuid('Class external Id is required.Invalid UUID'),
  }),
});

export const updateTestValidation = z.object({
  params: z.object({
    externalId: z.uuid('Class external Id is required.Invalid UUID'),
  }),
  body: z.object({
    name: z.string('Test name is required in string').min(1).max(50).optional(),

    testType: z.enum(['MONTHLY', 'SESSION']).optional(),

    month: z.number('Valid Month is required between 1 to 12').min(1).max(12).optional(),
    year: z.number('Valid Year is required between 2000 to 2100').min(2000).max(2100).optional(),

    totalMarks: z.number('Totals Marks should be a valid number greater than 0').positive().optional(),

    classExternalId: z.uuid('Class is required').optional(),
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
