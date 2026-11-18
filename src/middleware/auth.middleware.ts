import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';
import { env } from '../lib/env.js';
import { ApiError } from '../common/responses/index.js';
import { INVALID_TOKEN, UNAUTHORIZED } from '../modules/auth/auth.messages.js';
import type { IJwtPayload } from '../modules/auth/auth.types.js';
import prisma from '../lib/prisma.js';

// Reads the auth JWT from the configured cookie, verifies it, and attaches
// the decoded payload to `req.user`. On any failure responds with a structured
// 401 envelope and does NOT call next() — the route handler never runs.
// The token must also carry the user's current tokenVersion, so a password change or reset
// ends sessions on other devices (one small lookup by primary key per request).
export const authMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.[env.authCookieName];

  if (!token) {
    res.status(StatusCodes.UNAUTHORIZED).json(ApiError.sendResponse(ApiError.format(null, UNAUTHORIZED)));
    return;
  }

  let decoded: IJwtPayload;
  try {
    decoded = jwt.verify(token, env.jwtSecret) as IJwtPayload;
  } catch {
    res.status(StatusCodes.UNAUTHORIZED).json(ApiError.sendResponse(ApiError.format(null, INVALID_TOKEN)));
    return;
  }

  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.userId }, select: { tokenVersion: true } });
    if (!user || user.tokenVersion !== (decoded.tokenVersion ?? 0)) {
      res.status(StatusCodes.UNAUTHORIZED).json(ApiError.sendResponse(ApiError.format(null, INVALID_TOKEN)));
      return;
    }
    req.user = {
      userId: decoded.userId,
      externalId: decoded.externalId,
      email: decoded.email,
    };
  } catch (error) {
    // A database failure is a server error, not a reason to sign the user out
    return next(error);
  }
  next();
};
