import { errorResponse } from '../utils/apiResponse.js';

export function errorHandler(err, req, res, next) {
  // If headers already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  console.error(`[Error] ${req.method} ${req.url}:`, err.message || err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const fields = err.meta?.target || [];
    return errorResponse(
      res,
      `A unique constraint violation occurred on field(s): ${Array.isArray(fields) ? fields.join(', ') : fields}`,
      409
    );
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return errorResponse(res, 'The requested database record does not exist or was already removed.', 404);
  }

  // Prisma foreign key constraint failure
  if (err.code === 'P2003') {
    return errorResponse(res, 'Foreign key constraint violated: referenced entity does not exist.', 400);
  }

  // Default server error
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal Server Error';

  return errorResponse(res, message, statusCode);
}
