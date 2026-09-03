import { StatusCodes } from 'http-status-codes';

// ── Login ───────────────────────────────────────────────────────────────
export const LOGIN_SUCCESSFUL = Object.freeze({
  message: 'Login successful',
  code: StatusCodes.OK,
});

export const INVALID_CREDENTIALS = Object.freeze({
  message: 'Invalid email or password',
  code: StatusCodes.UNAUTHORIZED,
});

// ── Session / Me / Logout ───────────────────────────────────────────────
export const UNAUTHORIZED = Object.freeze({
  message: 'Authentication required',
  code: StatusCodes.UNAUTHORIZED,
});

export const INVALID_TOKEN = Object.freeze({
  message: 'Invalid or expired session — please log in again',
  code: StatusCodes.UNAUTHORIZED,
});

export const ME_FETCHED_SUCCESSFULLY = Object.freeze({
  message: 'Current user fetched successfully',
  code: StatusCodes.OK,
});

export const USER_NOT_FOUND = Object.freeze({
  message: 'User not found',
  code: StatusCodes.NOT_FOUND,
});

export const LOGOUT_SUCCESSFUL = Object.freeze({
  message: 'Logged out successfully',
  code: StatusCodes.OK,
});

// ── Password reset ──────────────────────────────────────────────────────
// Intentionally vague — we never confirm whether an email is registered,
// so attackers can't enumerate accounts.
export const RESET_LINK_SENT = Object.freeze({
  message: 'If an account exists for that email, a password reset link has been sent',
  code: StatusCodes.OK,
});

export const FORGOT_PASSWORD_FAILURE = Object.freeze({
  message: 'Failed to process password reset request',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});

export const RESET_TOKEN_INVALID = Object.freeze({
  message: 'Reset link is invalid, expired, or has already been used',
  code: StatusCodes.BAD_REQUEST,
});

export const PASSWORD_RESET_SUCCESSFUL = Object.freeze({
  message: 'Password has been reset — please log in with your new password',
  code: StatusCodes.OK,
});

export const PASSWORD_RESET_FAILURE = Object.freeze({
  message: 'Failed to reset password',
  code: StatusCodes.INTERNAL_SERVER_ERROR,
});
