import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../config/prisma.js';
import { ENV } from '../../config/env.js';

export async function authenticateUser({ email, password, role, ipAddress = '127.0.0.1' }) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (!user) {
    throw new Error('Invalid email or credentials.');
  }

  if (user.status === 'Disabled') {
    throw new Error('Account has been disabled. Please contact the administrator.');
  }

  // Strict password verification
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw new Error('Invalid email or password.');
  }

  // Update last login
  await prisma.user.update({
    where: { id: user.id },
    data: { lastLogin: new Date() },
  });

  const effectiveRole = role || user.role.toLowerCase();

  // Issue token
  const token = jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: effectiveRole,
      name: user.name,
    },
    ENV.JWT_SECRET,
    { expiresIn: ENV.JWT_EXPIRES_IN }
  );

  // Record audit log
  await prisma.auditLog.create({
    data: {
      actor: user.name,
      action: 'USER_AUTHENTICATION',
      entity: `Session initiated for ${user.email} (${effectiveRole})`,
      ipAddress,
      status: 'Success',
      userId: user.id,
    },
  });

  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: effectiveRole,
      userType: user.userType,
      avatar: user.avatar,
      twoFactor: user.twoFactor,
      status: user.status,
    },
  };
}

export async function getUserProfile(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      userType: true,
      status: true,
      twoFactor: true,
      avatar: true,
      lastLogin: true,
    },
  });

  if (!user) {
    throw new Error('User not found.');
  }

  return user;
}

export async function logUserLogout(userId, actorName = 'Active User', ipAddress = '127.0.0.1') {
  await prisma.auditLog.create({
    data: {
      actor: actorName,
      action: 'USER_LOGOUT',
      entity: 'Session terminated',
      ipAddress,
      status: 'Success',
      userId,
    },
  });
}
