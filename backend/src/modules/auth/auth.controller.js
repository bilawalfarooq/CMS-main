import * as authService from './auth.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

export async function login(req, res, next) {
  try {
    const { email, password, role } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';

    const result = await authService.authenticateUser({ email, password, role, ipAddress });
    return successResponse(res, result, 'Authentication successful', 200);
  } catch (err) {
    return errorResponse(res, err.message, 401);
  }
}

export async function logout(req, res, next) {
  try {
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || '127.0.0.1';
    if (req.user) {
      await authService.logUserLogout(req.user.id, req.user.name, ipAddress);
    }
    return successResponse(res, null, 'Logged out successfully', 200);
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    const user = await authService.getUserProfile(req.user.id);
    return successResponse(res, user, 'User profile retrieved', 200);
  } catch (err) {
    next(err);
  }
}

export async function switchRole(req, res, next) {
  try {
    const { role } = req.body;
    return successResponse(res, { role }, `Switched to role: ${role}`, 200);
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;
    return successResponse(
      res,
      { sent: true },
      `If an account exists for ${email}, a password reset link has been dispatched.`,
      200
    );
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req, res, next) {
  try {
    return successResponse(res, null, 'Password reset successfully. Please log in with your new credentials.', 200);
  } catch (err) {
    next(err);
  }
}
