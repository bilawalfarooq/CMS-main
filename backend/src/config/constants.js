export const ROLES = {
  SUPER_ADMIN: 'super_admin',
  PRINCIPAL: 'principal',
  TEACHER: 'teacher',
  ADMIN_STAFF: 'admin_staff',
  GUARDIAN: 'guardian',
  STUDENT: 'student',
};

export const ASSESSMENT_WEIGHTS = {
  quiz1: 0.15,
  midterm: 0.35,
  project: 0.20,
  finalExam: 0.30,
};

export const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024; // 2.0 MB maximum ceiling

export const DEFAULT_RBAC_MATRIX = [
  { module: 'Student Records (SIS)', view: ['super_admin', 'principal', 'teacher', 'admin_staff'], create: ['super_admin', 'admin_staff'], edit: ['super_admin', 'admin_staff'], delete: ['super_admin'], export: ['super_admin', 'principal', 'admin_staff'] },
  { module: 'Staff & Faculty Management', view: ['super_admin', 'principal', 'admin_staff'], create: ['super_admin'], edit: ['super_admin', 'principal'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Section Attendance Engine', view: ['super_admin', 'principal', 'teacher', 'admin_staff', 'guardian'], create: ['super_admin', 'teacher'], edit: ['super_admin', 'teacher'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Gradebook & Transcripts', view: ['super_admin', 'principal', 'teacher', 'guardian'], create: ['super_admin', 'teacher'], edit: ['super_admin', 'teacher'], delete: ['super_admin'], export: ['super_admin', 'principal', 'teacher', 'guardian'] },
  { module: 'Fee & Billing Governance', view: ['super_admin', 'principal', 'admin_staff', 'guardian'], create: ['super_admin', 'admin_staff'], edit: ['super_admin', 'admin_staff'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Exam & Invigilation Schedules', view: ['super_admin', 'principal', 'teacher', 'admin_staff'], create: ['super_admin', 'principal'], edit: ['super_admin', 'principal'], delete: ['super_admin'], export: ['super_admin', 'principal'] },
  { module: 'Redis Queue & Infra Telemetry', view: ['super_admin', 'principal'], create: ['super_admin'], edit: ['super_admin'], delete: ['super_admin'], export: ['super_admin'] }
];
