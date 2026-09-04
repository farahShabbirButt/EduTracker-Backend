import { z } from 'zod';

export const createGradeScaleValidation = z.object({
  body: z
    .object({
      minPercentage: z.number().min(0).max(100),
      maxPercentage: z.number().min(0).max(100),
      grade: z.string().min(1, 'Grade is required').max(5),
      remarks: z.string().min(1, 'Remarks are required'),
    })
    .refine((d) => d.minPercentage < d.maxPercentage, {
      message: 'minPercentage must be less than maxPercentage',
      path: ['minPercentage'],
    }),
});

export const updateGradeScaleValidation = z.object({
  body: z
    .object({
      minPercentage: z.number().min(0).max(100).optional(),
      maxPercentage: z.number().min(0).max(100).optional(),
      grade: z.string().min(1, 'Grade is required').max(5).optional(),
      remarks: z.string().min(1, 'Remarks are required').optional(),
    })
    .refine(
      (d) => d.minPercentage === undefined || d.maxPercentage === undefined || d.minPercentage < d.maxPercentage,
      {
        message: 'minPercentage must be less than maxPercentage',
        path: ['minPercentage'],
      },
    ),
});
