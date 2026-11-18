import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import {
  changePasswordLimit,
  forgotPasswordLimit,
  loginLimit,
  resetPasswordLimit,
} from '../../middleware/rateLimit.middleware.js';
import { AuthController, AuthValidation } from './index.js';

const router = Router();

router.post('/login', loginLimit, ZodValidator(AuthValidation.loginValidation), AuthController.login);
router.post('/logout', AuthController.logout);
router.post(
  '/forgot-password',
  forgotPasswordLimit,
  ZodValidator(AuthValidation.forgotPasswordValidation),
  AuthController.forgotPassword,
);
router.post(
  '/reset-password',
  resetPasswordLimit,
  ZodValidator(AuthValidation.resetPasswordValidation),
  AuthController.resetPassword,
);

// authMiddleware is applied per-route, not to the whole router: login, logout,
// and password reset must stay reachable while logged out.
router.get('/me', authMiddleware, AuthController.me);
router.put(
  '/profile',
  authMiddleware,
  ZodValidator(AuthValidation.updateProfileValidation),
  AuthController.updateProfile,
);
router.put(
  '/password',
  authMiddleware,
  changePasswordLimit,
  ZodValidator(AuthValidation.changePasswordValidation),
  AuthController.changePassword,
);

export default router;
