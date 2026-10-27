import { z } from 'zod';

export const listUsersSchema = {
  query: z.object({
    search: z.string().optional(),
    role: z.string().optional(),
    status: z.string().optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

export const createUserSchema = {
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Valid institutional email is required'),
    role: z.enum(['super_admin', 'principal', 'teacher', 'admin_staff', 'guardian', 'student']),
    userType: z.string().optional(),
    password: z.string().min(6).optional(),
    initialPassword: z.string().min(6).optional().default('ChangeMe#2026!'),
  }),
};
