import bcrypt from 'bcryptjs';
import prisma from '../../config/prisma.js';

export async function getUsers({ search, role, status, page = 1, pageSize = 20 }) {
  const where = {};

  if (search && search.trim()) {
    const q = search.trim();
    where.OR = [
      { name: { contains: q, mode: 'insensitive' } },
      { email: { contains: q, mode: 'insensitive' } },
      { id: { contains: q, mode: 'insensitive' } },
    ];
  }

  if (role && role !== 'All') {
    where.role = role.toUpperCase();
  }

  if (status && status !== 'All') {
    where.status = status;
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { createdAt: 'desc' },
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
        createdAt: true,
      },
    }),
  ]);

  return {
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize) || 1,
    users: users.map((u) => ({
      ...u,
      role: u.role.toLowerCase(),
      lastLogin: u.lastLogin ? u.lastLogin.toISOString() : 'Never',
    })),
  };
}

export async function createUser({ name, email, role, userType, password, initialPassword = 'ChangeMe#2026!' }) {
  const normalizedEmail = email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });

  if (existing) {
    throw new Error(`An account already exists for ${normalizedEmail}.`);
  }

  const effectivePassword = password || initialPassword;
  const passwordHash = await bcrypt.hash(effectivePassword, 10);
  const roleEnum = role.toUpperCase();

  let derivedType = userType;
  if (!derivedType) {
    if (role === 'guardian') derivedType = 'Parent / Guardian';
    else if (role === 'teacher') derivedType = 'Faculty / Staff';
    else if (role === 'admin_staff') derivedType = 'Administrative Staff';
    else if (role === 'super_admin') derivedType = 'Administrator';
    else derivedType = 'Enrolled Student';
  }

  const created = await prisma.user.create({
    data: {
      name: name.trim(),
      email: normalizedEmail,
      role: roleEnum,
      userType: derivedType,
      passwordHash,
      status: 'Active',
      twoFactor: false,
    },
  });

  return {
    id: created.id,
    name: created.name,
    email: created.email,
    role: created.role.toLowerCase(),
    userType: created.userType,
    status: created.status,
    twoFactor: created.twoFactor,
  };
}

export async function toggleUserStatus(userId, actor = 'System Administrator') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  const nextStatus = user.status === 'Active' ? 'Disabled' : 'Active';

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status: nextStatus },
  });

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'USER_STATUS_CHANGE',
      entity: `Account status for ${user.name} toggled to ${nextStatus}`,
      ipAddress: '127.0.0.1',
      status: 'Success',
      userId: user.id,
    },
  });

  return {
    id: updated.id,
    status: updated.status,
  };
}

export async function sendPasswordResetLink(userId, actor = 'System Administrator') {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error('User not found');

  await prisma.queueJobRecord.create({
    data: {
      jobType: 'EMAIL_DISPATCH',
      target: user.email,
      recipient: user.name,
      status: 'Completed',
      description: `Secure one-time password reset link dispatched to ${user.email}`,
    },
  });

  await prisma.auditLog.create({
    data: {
      actor,
      action: 'PASSWORD_RESET_DISPATCH',
      entity: `Password reset dispatched for ${user.email}`,
      ipAddress: '127.0.0.1',
      status: 'Success',
      userId: user.id,
    },
  });

  return { success: true, email: user.email };
}
