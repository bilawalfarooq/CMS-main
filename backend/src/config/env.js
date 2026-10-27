import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from backend root
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const ENV = {
  PORT: process.env.PORT || 5000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/educore_cms?schema=public',
  JWT_SECRET: process.env.JWT_SECRET || 'educore-super-secure-jwt-secret-key-change-in-production-2026',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',

  // Staging / External Services Configuration
  SMTP_HOST: process.env.SMTP_HOST || 'sandbox.smtp.mailtrap.io',
  SMTP_PORT: Number(process.env.SMTP_PORT) || 2525,
  SMTP_USER: process.env.SMTP_USER || 'staging_test_user',
  SMTP_PASS: process.env.SMTP_PASS || 'staging_test_pass',
  SMTP_FROM: process.env.SMTP_FROM || 'no-reply@educore.edu',

  STORAGE_DRIVER: process.env.STORAGE_DRIVER || 'local',
  STORAGE_BUCKET: process.env.STORAGE_BUCKET || 'educore-vault-staging',
  STORAGE_REGION: process.env.STORAGE_REGION || 'us-east-1',
};
