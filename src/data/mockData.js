/**
 * Institutional Static Roles Configuration
 * All entity records (students, staff, attendance, invoices, grades, documents, exams, etc.)
 * are queried directly from the PostgreSQL database via the Express API.
 */

export const ACADEMIC_YEARS = [
  { id: 'ay-2026', name: '2026 - 2027', status: 'Active', startDate: '2026-08-15', endDate: '2027-06-20' },
  { id: 'ay-2025', name: '2025 - 2026', status: 'Archived', startDate: '2025-08-15', endDate: '2026-06-20' },
  { id: 'ay-2024', name: '2024 - 2025', status: 'Archived', startDate: '2024-08-15', endDate: '2025-06-20' },
];

export const ROLES = [
  { id: 'super_admin', label: 'Super Admin', description: 'Institutional infrastructure, SBTE compliance & security', badgeColor: 'bg-rose-100 text-rose-800 border-rose-200' },
  { id: 'principal', label: 'Principal / Dean', description: 'Academic council, faculty oversight & SBTE liaison', badgeColor: 'bg-purple-100 text-purple-800 border-purple-200' },
  { id: 'hod', label: 'Head of Department', description: 'Department academics, faculty coordination & curriculum', badgeColor: 'bg-indigo-100 text-indigo-800 border-indigo-200' },
  { id: 'teacher', label: 'Technical Faculty', description: 'Lab practicals, attendance, course modules & evaluations', badgeColor: 'bg-blue-100 text-blue-800 border-blue-200' },
  { id: 'admin_staff', label: 'Admissions Officer', description: 'SBTE registration, enrollment, fee vouchers & records', badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  { id: 'accountant', label: 'Accountant', description: 'Fee collection, billing, financial reports & ledger', badgeColor: 'bg-teal-100 text-teal-800 border-teal-200' },
  { id: 'student', label: 'Student', description: 'View attendance, results, fee status & timetable', badgeColor: 'bg-sky-100 text-sky-800 border-sky-200' },
  { id: 'guardian', label: 'Guardian / Parent', description: 'Attendance tracking, fee slips, exam slips & results', badgeColor: 'bg-amber-100 text-amber-800 border-amber-200' },
];

export const INITIAL_STUDENTS = [];
export const INITIAL_CLASSES = [];
export const INITIAL_ATTENDANCE = [];
export const INITIAL_GRADES = [];
export const MOCK_INVOICES = [];

