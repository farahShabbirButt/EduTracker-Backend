import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import prisma from '../../lib/prisma.js';
import { ApiError } from '../../common/responses/index.js';
import { env } from '../../lib/env.js';
import { EmailService } from '../../lib/email.js';
import * as AuthMessages from './auth.messages.js';
import type {
  ILoginPayload,
  IJwtPayload,
  IAuthUser,
  IForgotPasswordPayload,
  IResetPasswordPayload,
} from './auth.types.js';

// A bcrypt hash of a value no one can supply. When the email is unknown we still
// run a compare against this so the response time does not reveal whether the
// account exists — the same reason login returns one error for both failure modes.
const DUMMY_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour — matches the wording in the reset email

type UserRow = { externalId: string; email: string; name: string | null; lastLoginAt: Date | null };

const toAuthUser = (user: UserRow): IAuthUser => ({
  externalId: user.externalId,
  email: user.email,
  name: user.name,
  lastLoginAt: user.lastLoginAt,
});

class AuthService {
  async login(payload: ILoginPayload): Promise<IAPISuccessResponse> {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    const passwordMatches = await bcrypt.compare(payload.password, user?.passwordHash ?? DUMMY_HASH);

    if (!user || !passwordMatches) {
      throw ApiError.format('', AuthMessages.INVALID_CREDENTIALS);
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const jwtPayload: IJwtPayload = {
      userId: user.id,
      externalId: user.externalId,
      email: user.email,
    };

    const token = jwt.sign(jwtPayload, env.jwtSecret, {
      expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'],
    });

    return {
      keyName: 'auth',
      auth: { user: toAuthUser(updated), token },
      code: AuthMessages.LOGIN_SUCCESSFUL.code,
      message: AuthMessages.LOGIN_SUCCESSFUL.message,
      success: true,
    };
  }

  async getMe(externalId: string): Promise<IAPISuccessResponse> {
    const user = await prisma.user.findUnique({ where: { externalId } });

    if (!user) {
      throw ApiError.format('', AuthMessages.USER_NOT_FOUND);
    }

    return {
      keyName: 'user',
      user: toAuthUser(user),
      code: AuthMessages.ME_FETCHED_SUCCESSFULLY.code,
      message: AuthMessages.ME_FETCHED_SUCCESSFULLY.message,
      success: true,
    };
  }

  async forgotPassword(payload: IForgotPasswordPayload): Promise<IAPISuccessResponse> {
    const user = await prisma.user.findUnique({ where: { email: payload.email } });

    // No early return and no branch in the response: an unknown email produces
    // exactly the same reply as a known one, so this cannot be used to discover
    // which addresses have accounts.
    if (user) {
      const rawToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');

      await prisma.$transaction([
        // Requesting a new link invalidates any outstanding one.
        prisma.passwordResetToken.updateMany({
          where: { userId: user.id, usedAt: null },
          data: { usedAt: new Date() },
        }),
        prisma.passwordResetToken.create({
          data: {
            userId: user.id,
            tokenHash,
            expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
          },
        }),
      ]);

      const resetUrl = `${env.frontendUrl}/reset-password?token=${rawToken}`;

      // Deliberately not awaited: awaiting makes the response time depend on whether the
      // account exists, which is an enumeration oracle. Failures are logged, never surfaced.
      void EmailService.sendPasswordResetEmail(user.email, resetUrl).catch((error) => {
        console.error('Failed to send password reset email:', error);
      });
    }

    return {
      keyName: 'passwordReset',
      passwordReset: { requested: true },
      code: AuthMessages.RESET_LINK_SENT.code,
      message: AuthMessages.RESET_LINK_SENT.message,
      success: true,
    };
  }

  async resetPassword(payload: IResetPasswordPayload): Promise<IAPISuccessResponse> {
    // Only the hash is stored, so a database leak cannot be replayed into a
    // password reset. The raw token exists only in the email.
    const tokenHash = crypto.createHash('sha256').update(payload.token).digest('hex');

    const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

    if (!record || record.usedAt !== null || record.expiresAt <= new Date()) {
      throw ApiError.format('', AuthMessages.RESET_TOKEN_INVALID);
    }

    const passwordHash = await bcrypt.hash(payload.newPassword, 10);

    await prisma.$transaction([
      prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
      prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
    ]);

    return {
      keyName: 'passwordReset',
      passwordReset: { reset: true },
      code: AuthMessages.PASSWORD_RESET_SUCCESSFUL.code,
      message: AuthMessages.PASSWORD_RESET_SUCCESSFUL.message,
      success: true,
    };
  }
}

export default new AuthService();
