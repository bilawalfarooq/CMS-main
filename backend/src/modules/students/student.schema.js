import { z } from 'zod';

export const listStudentsSchema = {
  query: z.object({
    search: z.string().optional(),
    grade: z.string().optional(),
    section: z.string().optional(),
    status: z.string().optional(),
    academicYear: z.string().optional(),
    sortField: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    pageSize: z.string().regex(/^\d+$/).transform(Number).optional(),
  }),
};

export const createStudentSchema = {
  body: z.object({
    id: z.string().optional(),
    name: z.string().min(2, 'Full legal name is required'),
    dob: z.string().refine((val) => !isNaN(Date.parse(val)) && new Date(val) <= new Date(), {
      message: 'Date of birth must be a valid date in the past',
    }),
    gender: z.string().min(1, 'Gender is required'),
    grade: z.string().min(1, 'Grade is required'),
    section: z.string().min(1, 'Section is required'),
    academicYear: z.string().optional(),
    admissionDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
      message: 'Admission date must be a valid date',
    }),
    rollNo: z.string().optional(),
    customId: z.string().optional(),
    customRoll: z.string().optional(),
    guardianName: z.string().min(2, 'Primary guardian name is required'),
    guardianPhone: z.string().min(5, 'Primary guardian contact phone is required'),
    guardianEmail: z.string().email('Valid guardian email is required'),
    secondaryGuardianName: z.string().optional(),
    secondaryGuardianPhone: z.string().optional(),
    secondaryGuardianRelation: z.string().optional(),
    emergencyContact: z.string().optional(),
    bloodGroup: z.string().optional(),
    previousSchool: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().optional(),
    status: z.enum(['Active', 'On-Leave', 'Suspended', 'Withdrawn', 'Graduated']).optional().default('Active'),
  }),
};

export const updateStudentSchema = {
  body: z.object({
    name: z.string().min(2).optional(),
    dob: z.string().optional(),
    gender: z.string().optional(),
    bloodGroup: z.string().optional(),
    previousSchool: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().optional(),
    guardianName: z.string().optional(),
    guardianPhone: z.string().optional(),
    guardianEmail: z.string().email().optional(),
    secondaryGuardianName: z.string().optional(),
    secondaryGuardianPhone: z.string().optional(),
    secondaryGuardianRelation: z.string().optional(),
    emergencyContact: z.string().optional(),
  }),
};

export const updateStatusSchema = {
  body: z.object({
    status: z.enum(['Active', 'On-Leave', 'Suspended', 'Withdrawn', 'Graduated']),
    reason: z.string().optional(),
  }),
};

export const batchPromotionSchema = {
  body: z.object({
    studentIds: z.array(z.string()).min(1, 'At least one student must be selected for promotion'),
    sourceGrade: z.string().min(1, 'Source grade is required'),
    sourceSection: z.string().min(1, 'Source section is required'),
    sourceAcademicYear: z.string().optional(),
    targetAcademicYear: z.string().min(1, 'Target academic year is required'),
    targetGrade: z.string().min(1, 'Target grade is required'),
    targetSection: z.string().min(1, 'Target section is required'),
  }),
};
