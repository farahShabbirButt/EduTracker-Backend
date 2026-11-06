import { z } from 'zod';

// bcrypt ignores everything after 72 bytes, so a longer password protects nothing extra
const MAX_PASSWORD_BYTES = 72;
const fitsBcrypt = (password: string) => Buffer.byteLength(password) <= MAX_PASSWORD_BYTES;
const TOO_LONG = 'Password must be at most 72 characters';

export const loginValidation = z.object({
  body: z.object({
    email: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Email is required.' : 'Email must be a string.'),
      })
      .trim()
      .toLowerCase()
      .email('Invalid email format'),
    password: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Password is required.' : 'Password must be a string.'),
      })
      .min(1, 'Password is required'),
  }),
});

export const forgotPasswordValidation = z.object({
  body: z.object({
    email: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Email is required.' : 'Email must be a string.'),
      })
      .trim()
      .toLowerCase()
      .email('Invalid email format'),
  }),
});

export const resetPasswordValidation = z.object({
  body: z.object({
    token: z
      .string({
        error: (iss) => (iss.input === undefined ? 'Reset token is required.' : 'Reset token must be a string.'),
      })
      .min(1, 'Reset token is required'),
    // Password policy: length over complexity (NIST 2017 guidance).
    // 8 chars is a sane floor; we don't enforce uppercase/digit/symbol mixes.
    newPassword: z
      .string({
        error: (iss) => (iss.input === undefined ? 'New password is required.' : 'New password must be a string.'),
      })
      .min(8, 'New password must be at least 8 characters')
      .refine(fitsBcrypt, TOO_LONG),
  }),
});

export const updateProfileValidation = z.object({
  body: z.object({
    name: z.string('Name is required').trim().min(1, 'Name is required').max(100),
    email: z.string('Email is required').trim().toLowerCase().email('Invalid email format'),
    // Required by the service when the email changes
    currentPassword: z.string().optional(),
  }),
});

export const changePasswordValidation = z.object({
  body: z.object({
    currentPassword: z.string('Current password is required').min(1, 'Current password is required'),
    newPassword: z
      .string('New password is required')
      .min(8, 'New password must be at least 8 characters')
      .refine(fitsBcrypt, TOO_LONG),
  }),
});
