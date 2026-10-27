import { errorResponse } from '../utils/apiResponse.js';

export function authorize(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required before authorization check.', 401);
    }

    // Super Admin has immutable root bypass authority
    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'super_admin') {
      return next();
    }

    const userRole = (req.user.role || '').toLowerCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toLowerCase());

    if (normalizedAllowed.length > 0 && !normalizedAllowed.includes(userRole)) {
      return errorResponse(
        res,
        `Access denied. Role '${req.user.role}' is not authorized for this resource.`,
        403
      );
    }

    next();
  };
}
