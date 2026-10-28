import express from 'express';
import cors from 'cors';
import { ENV } from './config/env.js';
import { errorHandler } from './middleware/errorHandler.js';
import prisma from './config/prisma.js';

// Import module routers
import authRoutes from './modules/auth/auth.routes.js';
import userRoutes from './modules/users/user.routes.js';
import rbacRoutes from './modules/rbac/rbac.routes.js';
import dashboardRoutes from './modules/dashboard/dashboard.routes.js';
import academicRoutes from './modules/academic-years/academic.routes.js';
import studentRoutes from './modules/students/student.routes.js';
import staffRoutes from './modules/staff/staff.routes.js';
import timetableRoutes from './modules/timetable/timetable.routes.js';
import attendanceRoutes from './modules/attendance/attendance.routes.js';
import gradebookRoutes from './modules/gradebook/gradebook.routes.js';
import examRoutes from './modules/gradebook/exam.routes.js';
import financeRoutes from './modules/finance/finance.routes.js';
import documentRoutes from './modules/documents/document.routes.js';
import portalRoutes from './modules/guardians/portal.routes.js';
import notificationRoutes from './modules/notifications/notification.routes.js';
import settingsRoutes from './modules/settings/settings.routes.js';
import auditRoutes from './modules/audit-logs/audit.routes.js';
import classRoutes from './modules/classes/class.routes.js';

const app = express();

// Trust reverse proxies (Cloudflare, NGINX, localhost proxies)
app.set('trust proxy', true);

// Middleware
app.use(
  cors({
    origin: [ENV.FRONTEND_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health Check Endpoint
app.get('/api/v1/health', async (req, res) => {
  let dbStatus = 'disconnected';
  try {
    await prisma.$queryRaw`SELECT 1`;
    dbStatus = 'connected';
  } catch (err) {
    dbStatus = `error: ${err.message}`;
  }

  return res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: ENV.NODE_ENV,
    database: dbStatus,
  });
});

// Module Routes
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/rbac', rbacRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);
app.use('/api/v1/academic-years', academicRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/students', studentRoutes);
app.use('/api/v1/staff', staffRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/attendance', attendanceRoutes);
app.use('/api/v1/gradebook', gradebookRoutes);
app.use('/api/v1/exams', examRoutes);
app.use('/api/v1/finance', financeRoutes);
app.use('/api/v1/documents', documentRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/settings', settingsRoutes);
app.use('/api/v1/audit-logs', auditRoutes);

// Centralized Error Handling
app.use(errorHandler);

export default app;
