import { z } from 'zod';

// The screen shrinks a logo before sending it, because every card carries it. app.ts lets this
// route's body reach this size.
const LOGO_MAX_LENGTH = 450_000;
const LOGO_DATA_URL = /^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/;

export const saveInstituteValidation = z.object({
  body: z.object({
    name: z.string('School name is required').trim().min(1, 'School name is required').max(100),
    address: z.string('Address is required').trim().min(1, 'Address is required').max(200),
    phone: z.string('Phone is required').trim().min(1, 'Phone is required').max(30),
    schoolYearStartDate: z.iso
      .date('School year start date is required')
      .refine((date) => date >= '2000-01-01' && date <= '2100-12-31', 'Enter a date between 2000 and 2100'),
    // Left out keeps the saved logo; null removes it
    logo: z
      .string()
      .max(LOGO_MAX_LENGTH, 'Logo is too large')
      .regex(LOGO_DATA_URL, 'Logo must be a PNG, JPG or WEBP image')
      .nullable()
      .optional(),
  }),
});
