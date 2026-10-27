import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    email: z.string().email('Valid institutional email is required'),
    password: z.string().min(1, 'Password is required'),
    role: z.string().optional(),
  }),
};

export const switchRoleSchema = {
  body: z.object({
    role: z.enum(['super_admin', 'principal', 'teacher', 'admin_staff', 'guardian', 'student']),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Valid institutional email is required'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
  }),
};
