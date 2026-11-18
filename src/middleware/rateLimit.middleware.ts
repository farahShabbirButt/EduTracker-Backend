import type { Request, Response } from 'express';
import { rateLimit, type Options } from 'express-rate-limit';
import { StatusCodes } from 'http-status-codes';
import { ApiError } from '../common/responses/index.js';

// Limits on the routes a password can be guessed or an inbox flooded through, counted per
// visitor address (req.ip; see TRUST_PROXY in lib/env.ts). Counts live in memory, which suits
// the one server EduTracker runs on; a restart clears them.

const MINUTE = 60 * 1000;

const tooMany = (what: string) => (req: Request, res: Response) => {
  const resetTime = (req as Request & { rateLimit?: { resetTime?: Date } }).rateLimit?.resetTime;
  const minutes = resetTime ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / MINUTE)) : 15;
  const message = `Too many ${what}. Wait ${minutes} minute${minutes === 1 ? '' : 's'}, then try again`;
  const error = ApiError.format({ message, code: StatusCodes.TOO_MANY_REQUESTS });
  res
    .status(StatusCodes.TOO_MANY_REQUESTS)
    .json(ApiError.sendResponse({ ...error, code: StatusCodes.TOO_MANY_REQUESTS }));
};

const limit = (options: Partial<Options> & { what: string }) => {
  const { what, ...rest } = options;
  return rateLimit({ standardHeaders: 'draft-8', legacyHeaders: false, handler: tooMany(what), ...rest });
};

// Wrong passwords only: signing in successfully doesn't use up the allowance
export const loginLimit = limit({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  what: 'sign-in attempts',
});

// Each request can send an email
export const forgotPasswordLimit = limit({ windowMs: 60 * MINUTE, limit: 5, what: 'reset requests' });

// Reset links carry a long random token, but guessing it should still be slow
export const resetPasswordLimit = limit({ windowMs: 15 * MINUTE, limit: 10, what: 'reset attempts' });

// Changing the password asks for the current one, which could be guessed from a left-open session
export const changePasswordLimit = limit({
  windowMs: 15 * MINUTE,
  limit: 10,
  skipSuccessfulRequests: true,
  what: 'password attempts',
});
