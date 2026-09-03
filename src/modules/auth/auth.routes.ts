import { Router } from 'express';
import { ZodValidator } from '../../middleware/ZodValidator.js';
import { authMiddleware } from '../../middleware/auth.middleware.js';
import { AuthController, AuthValidation } from './index.js';

const router = Router();

router.post('/login', ZodValidator(AuthValidation.loginValidation), AuthController.login);
router.post('/logout', AuthController.logout);
router.post('/forgot-password', ZodValidator(AuthValidation.forgotPasswordValidation), AuthController.forgotPassword);
router.post('/reset-password', ZodValidator(AuthValidation.resetPasswordValidation), AuthController.resetPassword);

// authMiddleware is applied per-route, not to the whole router: login, logout,
// and password reset must stay reachable while logged out.
router.get('/me', authMiddleware, AuthController.me);

export default router;
