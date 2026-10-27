import { errorResponse } from '../utils/apiResponse.js';

export function validateRequest(schemas) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      next();
    } catch (err) {
      if (err.errors) {
        const formattedErrors = {};
        err.errors.forEach((e) => {
          const field = e.path.join('.') || 'general';
          formattedErrors[field] = e.message;
        });
        return errorResponse(res, 'Validation failed', 400, formattedErrors);
      }
      return errorResponse(res, err.message || 'Validation error', 400);
    }
  };
}
