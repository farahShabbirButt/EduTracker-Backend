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

// sameSite 'none' + secure is required in production because the deployment is
// cross-site (Vercel frontend, Railway backend). In development localhost:5173
// and localhost:5000 are same-site, where 'lax' is correct and 'none' would be
// rejected for lacking Secure over plain http.
export const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === 'production',
  sameSite: (env.nodeEnv === 'production' ? 'none' : 'lax') as 'none' | 'lax',
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
