import { Request, Response, NextFunction } from 'express';
import { BaseController } from '../../common/base/baseController.js';
import { env } from '../../lib/env.js';
import { AuthService } from './index.js';
import * as AuthMessages from './auth.messages.js';
import type { IAuthUser } from './auth.types.js';

// Keep in sync with JWT_EXPIRES_IN in .env (default '24h').
// jsonwebtoken takes a duration string; res.cookie takes milliseconds.
// One constant for both so the cookie cannot outlive the token it carries.
export const AUTH_COOKIE_MAX_AGE_MS = 24 * 60 * 60 * 1000;

// The app and the API share one address in production (the backend serves the built
// frontend), so the cookie is first-party and 'lax' works everywhere. 'lax' also means another
// site can't send a request that carries it, except plain links. Secure in production (HTTPS);
// development runs on plain http on localhost, where a Secure cookie wouldn't be stored.
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: 'lax' as const,
  path: '/',
};

class AuthController extends BaseController {
  login = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.login(req.body);
      const { token, user } = result.auth as { token: string; user: IAuthUser };

      res.cookie(env.authCookieName, token, { ...COOKIE_OPTIONS, maxAge: AUTH_COOKIE_MAX_AGE_MS });

      // The token leaves only in Set-Cookie. Echoing it into the JSON body would
      // make it readable from JavaScript and defeat the httpOnly choice.
      return this.sendSuccessResponse(res, { ...result, auth: { user } });
    } catch (error) {
      return next(error);
    }
  };

  logout = async (_req: Request, res: Response) => {
    // Options must match those used in res.cookie (minus maxAge) or the browser
    // will not clear the cookie.
    res.clearCookie(env.authCookieName, COOKIE_OPTIONS);

    return this.sendSuccessResponse(res, {
      keyName: 'logout',
      logout: { success: true },
      code: AuthMessages.LOGOUT_SUCCESSFUL.code,
      message: AuthMessages.LOGOUT_SUCCESSFUL.message,
      success: true,
    });
  };

  me = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.getMe(req.user!.externalId);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.updateProfile(req.user!.externalId, req.body);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  changePassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.changePassword(req.user!.externalId, req.body);
      // Other devices are signed out; this one stays in with a new token. Like login, the
      // token leaves only in Set-Cookie.
      const { token, ...passwordChange } = result.passwordChange as { token: string; changed: boolean };
      res.cookie(env.authCookieName, token, { ...COOKIE_OPTIONS, maxAge: AUTH_COOKIE_MAX_AGE_MS });
      return this.sendSuccessResponse(res, { ...result, passwordChange });
    } catch (error) {
      return next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.forgotPassword(req.body);
      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.resetPassword(req.body);

      // A password change invalidates the current session: whoever is holding a
      // cookie for this account may be exactly who the reset is defending against.
      res.clearCookie(env.authCookieName, COOKIE_OPTIONS);

      return this.sendSuccessResponse(res, result);
    } catch (error) {
      return next(error);
    }
  };
}

export default new AuthController();
