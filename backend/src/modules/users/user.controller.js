import * as userService from './user.service.js';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/apiResponse.js';

export async function listUsers(req, res, next) {
  try {
    const { search, role, status, page = 1, pageSize = 20 } = req.query;
    const result = await userService.getUsers({ search, role, status, page, pageSize });
    return paginatedResponse(res, result.users, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function createUser(req, res, next) {
  try {
    const created = await userService.createUser(req.body);
    return successResponse(res, created, 'User account created successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
}

export async function toggleStatus(req, res, next) {
  try {
    const { id } = req.params;
    const actor = req.user?.name || 'Administrator';
    const result = await userService.toggleUserStatus(id, actor);
    return successResponse(res, result, `User status updated to ${result.status}`, 200);
  } catch (err) {
    next(err);
  }
}

export async function sendReset(req, res, next) {
  try {
    const { id } = req.params;
    const actor = req.user?.name || 'Administrator';
    const result = await userService.sendPasswordResetLink(id, actor);
    return successResponse(res, result, `Password reset link dispatched to ${result.email}`, 200);
  } catch (err) {
    next(err);
  }
}
