import jwt from 'jsonwebtoken';
import { ENV } from '../config/env.js';
import { errorResponse } from '../utils/apiResponse.js';
import prisma from '../config/prisma.js';

export async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return errorResponse(res, 'Authentication required. No token provided.', 401);
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return errorResponse(res, 'Invalid authentication token.', 401);
    }

    // Retrieve active user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        userType: true,
        status: true,
        avatar: true,
      },
    });

    if (!user) {
      return errorResponse(res, 'User record no longer exists.', 401);
    }

    if (user.status === 'Disabled') {
      return errorResponse(res, 'Account has been disabled. Active session terminated.', 403);
    }

    req.user = user;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return errorResponse(res, 'Authentication token has expired. Please log in again.', 401);
    }
    return errorResponse(res, 'Invalid or malformed authentication token.', 401);
  }
}
