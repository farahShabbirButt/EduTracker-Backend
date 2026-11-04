import { z } from 'zod';

export const saveInstituteValidation = z.object({
  body: z.object({
    name: z.string('School name is required').trim().min(1, 'School name is required').max(100),
    address: z.string('Address is required').trim().min(1, 'Address is required').max(200),
    phone: z.string('Phone is required').trim().min(1, 'Phone is required').max(30),
    schoolYearStartMonth: z.number('School year start month is required').int().min(1).max(12),
  }),
});
