import { z } from 'zod';

export const createClassValidation = z.object({
  name: z
    .string({
      error: (iss) => (iss.input === undefined ? 'Class name is required.' : 'Class name should be string.'),
    })
    .min(1, 'Class name is required')
    .max(100, 'Class name must be less than 100 characters')
    .transform((v) => v.trim()),

  isActive: z.boolean().optional(),
});

export const updateClassValidation = z.object({
  name: z
    .string('Class name should be string.')
    .min(2, 'Class name must be at least 2 characters')
    .max(100, 'Class name must be less than 100 characters')
    .transform((v) => v.trim())
    .optional(),

  isActive: z.boolean().optional(),
});
