import { z } from 'zod';

export const createClassValidation = z.object({
  body: z.object({
    name: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Class name is required.' : 'Class name should be string.'),
      })
      .trim()
      .min(1, 'Class name is required')
      .max(100, 'Class name must be less than 100 characters'),

    isActive: z.boolean().optional(),
  }),
});

export const updateClassValidation = z.object({
  body: z.object({
    name: z
      .string('Class name should be string.')
      .trim()
      .min(1, 'Class name is required')
      .max(100, 'Class name must be less than 100 characters')
      .optional(),
  }),
});
