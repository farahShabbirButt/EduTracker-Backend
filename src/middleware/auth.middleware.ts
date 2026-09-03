import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { env } from '../lib/env.js';
import { ApiError } from '../common/responses/index.js';
import { INVALID_TOKEN, UNAUTHORIZED } from '../modules/auth/auth.messages.js';
import type { IJwtPayload } from '../modules/auth/auth.types.js';

// Reads the auth JWT from the configured cookie, verifies it, and attaches
// the decoded payload to `req.user`. On any failure responds with a structured
// 401 envelope and does NOT call next() — the route handler never runs.
export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const token = req.cookies?.[env.authCookieName];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json(ApiError.sendResponse(ApiError.format(null, UNAUTHORIZED)));
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as IJwtPayload;
    req.user = {
      userId: decoded.userId,
      externalId: decoded.externalId,
      email: decoded.email,
    };
    next();
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json(ApiError.sendResponse(ApiError.format(null, INVALID_TOKEN)));
  }
};
