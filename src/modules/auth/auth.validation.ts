import { z } from 'zod';

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
        error: (iss) =>
          iss.input === undefined ? 'New password is required.' : 'New password must be a string.',
      })
      .min(8, 'New password must be at least 8 characters'),
  }),
});
