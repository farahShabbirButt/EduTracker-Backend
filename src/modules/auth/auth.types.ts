// Request payloads (validated by Zod schemas in auth.validation.ts).
export interface ILoginPayload {
  email: string;
  password: string;
}

export interface IForgotPasswordPayload {
  email: string;
}

export interface IResetPasswordPayload {
  token: string;
  newPassword: string;
}

// What we sign into the JWT — kept small (no PII beyond email).
export interface IJwtPayload {
  userId: number;
  externalId: string;
  email: string;
}

// What the controllers / `req.user` see (no passwordHash, no internal flags).
export interface IAuthUser {
  externalId: string;
  email: string;
  name: string | null;
  lastLoginAt: Date | null;
}

// Global Express augmentation — every route handler can read `req.user`
// after `authMiddleware` runs. Optional because public routes (e.g. /auth/login)
// don't have it set.
declare global {
  // `declare global { namespace Express }` is the only way to augment Express's
  // Request type; ES module syntax cannot express a global ambient augmentation.
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: IJwtPayload;
    }
  }
}
