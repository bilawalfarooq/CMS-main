import { ACADEMIC_YEARS } from '../data/mockData.js';

/**
 * Academic Year Normalization Helpers
 */
export function getAcademicYearId(yearOrId) {
  if (!yearOrId) return 'ay-2026';
  const match = ACADEMIC_YEARS.find(ay => ay.id === yearOrId || ay.name === yearOrId);
  return match ? match.id : yearOrId;
}

export function getAcademicYearName(yearOrId) {
  if (!yearOrId) return '2026 - 2027';
  const match = ACADEMIC_YEARS.find(ay => ay.id === yearOrId || ay.name === yearOrId);
  return match ? match.name : yearOrId;
}

export function areAcademicYearsEqual(yearA, yearB) {
  if (!yearA || !yearB) return false;
  return getAcademicYearId(yearA) === getAcademicYearId(yearB);
}

/**
 * Collision-Resistant Student ID Generator
 * Generates an ID using the format STU-YYYY-XXXX and verifies uniqueness against all existing records.
 */
export function generateStudentId(existingStudents = [], prefix = 'STU-2026') {
  const existingIds = new Set(existingStudents.map(s => String(s.id || '').toUpperCase()));
  let candidate = '';
  let attempts = 0;
  do {
    const randomSuffix = String(Math.floor(1000 + Math.random() * 9000));
    candidate = `${prefix}-${randomSuffix}`;
    attempts++;
  } while (existingIds.has(candidate) && attempts < 1000);

  if (existingIds.has(candidate)) {
    candidate = `${prefix}-${Date.now().toString().slice(-4)}`;
  }
  return candidate;
}

/**
 * Unique Email Generator
 * Ensures generated emails do not silently collide with existing student emails.
 */
export function generateStudentEmail(fullName, existingStudents = []) {
  if (!fullName || typeof fullName !== 'string') return '';
  const baseUser = fullName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '.');

  const domain = 'student.educore.edu';
  const existingEmails = new Set(existingStudents.map(s => String(s.email || '').toLowerCase()));

  let candidate = `${baseUser}@${domain}`;
  let counter = 2;
  while (existingEmails.has(candidate)) {
    candidate = `${baseUser}.${counter}@${domain}`;
    counter++;
  }
  return candidate;
}

/**
 * Roll Number Allocation for a Cohort
 * Computes the next available roll number in a grade & section without collisions.
 */
export function allocateRollNumber({ section, existingStudents = [], excludeStudentId = null }) {
  const sectionPrefix = (section?.split(' ')[0] || 'SEC').replace(/[^a-zA-Z0-9]/g, '');
  const existingRolls = new Set(
    existingStudents
      .filter(s => s.section === section && s.id !== excludeStudentId && s.status !== 'Withdrawn')
      .map(s => String(s.rollNo || '').toUpperCase())
      .filter(Boolean)
  );

  let counter = 1;
  let candidate = `${sectionPrefix}-${String(counter).padStart(2, '0')}`;
  while (existingRolls.has(candidate.toUpperCase())) {
    counter++;
    candidate = `${sectionPrefix}-${String(counter).padStart(2, '0')}`;
  }
  return candidate;
}

/**
 * Student Admission Validator
 * Validates required fields, date formats, roll number uniqueness, and ID uniqueness.
 * Does NOT invent fake attendance, grades, or GPA.
 */
export function validateStudentAdmission({ studentData, existingStudents = [] }) {
  const errors = {};
  const safeData = studentData || {};

  // 1. Name validation
  const name = typeof safeData.name === 'string' ? safeData.name.trim() : '';
  if (!name) {
    errors.name = 'Full legal name is required';
  } else if (name.length < 2) {
    errors.name = 'Name must be at least 2 characters';
  }

  // 2. Date of Birth validation
  if (!safeData.dob) {
    errors.dob = 'Date of birth is required';
  } else {
    const dobDate = new Date(safeData.dob);
    if (isNaN(dobDate.getTime())) {
      errors.dob = 'Invalid date of birth format';
    } else if (dobDate > new Date()) {
      errors.dob = 'Date of birth cannot be in the future';
    }
  }

  // 3. Admission Date validation
  if (!safeData.admissionDate) {
    errors.admissionDate = 'Admission date is required';
  } else {
    const admDate = new Date(safeData.admissionDate);
    if (isNaN(admDate.getTime())) {
      errors.admissionDate = 'Invalid admission date format';
    }
  }

  // 4. Primary Guardian validation
  const guardianName = typeof safeData.guardianName === 'string' ? safeData.guardianName.trim() : '';
  if (!guardianName) {
    errors.guardianName = 'Primary guardian name is required';
  }

  const guardianPhone = typeof safeData.guardianPhone === 'string' ? safeData.guardianPhone.trim() : '';
  if (!guardianPhone) {
    errors.guardianPhone = 'Primary guardian phone is required';
  }

  // 5. Academic Placement validation
  if (!safeData.grade) {
    errors.grade = 'Academic grade is required';
  }
  if (!safeData.section) {
    errors.section = 'Section assignment is required';
  }

  // 6. Custom ID duplicate check
  if (safeData.customId && typeof safeData.customId === 'string' && safeData.customId.trim()) {
    const cleanId = safeData.customId.trim().toUpperCase();
    const isDuplicate = existingStudents.some(s => String(s.id || '').toUpperCase() === cleanId);
    if (isDuplicate) {
      errors.customId = `Student ID '${safeData.customId.trim()}' already exists in system`;
    }
  }

  // 7. Explicit Roll Number uniqueness check
  if (safeData.rollNo && typeof safeData.rollNo === 'string' && safeData.rollNo.trim()) {
    const cleanRoll = safeData.rollNo.trim().toUpperCase();
    const isDuplicateRoll = existingStudents.some(
      s =>
        s.grade === safeData.grade &&
        s.section === safeData.section &&
        s.status !== 'Withdrawn' &&
        String(s.rollNo || '').toUpperCase() === cleanRoll
    );
    if (isDuplicateRoll) {
      errors.rollNo = `Roll number '${safeData.rollNo.trim()}' is already taken in ${safeData.section}`;
    }
  }

  const isValid = Object.keys(errors).length === 0;

  if (!isValid) {
    return { isValid: false, errors, normalizedStudent: null };
  }

  // Generate unique ID and roll number if omitted
  const studentId = (safeData.customId && safeData.customId.trim())
    ? safeData.customId.trim()
    : generateStudentId(existingStudents);

  const rollNo = (safeData.rollNo && safeData.rollNo.trim())
    ? safeData.rollNo.trim()
    : allocateRollNumber({ section: safeData.section, existingStudents });

  const email = (safeData.email && safeData.email.trim())
    ? safeData.email.trim()
    : generateStudentEmail(name, existingStudents);

  const normalizedStudent = {
    ...safeData,
    id: studentId,
    name,
    rollNo,
    email,
    academicYear: getAcademicYearId(safeData.academicYear),
    dob: safeData.dob,
    admissionDate: safeData.admissionDate || new Date().toISOString().slice(0, 10),
    grade: safeData.grade,
    section: safeData.section,
    gender: safeData.gender || 'Other',
    bloodGroup: safeData.bloodGroup || 'O+',
    guardianName,
    guardianPhone,
    guardianEmail: safeData.guardianEmail ? safeData.guardianEmail.trim() : '',
    guardianRelation: safeData.guardianRelation || 'Father',
    secondaryGuardianName: safeData.secondaryGuardianName ? safeData.secondaryGuardianName.trim() : '',
    secondaryGuardianPhone: safeData.secondaryGuardianPhone ? safeData.secondaryGuardianPhone.trim() : '',
    secondaryGuardianRelation: safeData.secondaryGuardianRelation || '',
    emergencyContact: safeData.emergencyContact ? safeData.emergencyContact.trim() : '',
    address: safeData.address ? safeData.address.trim() : '',
    previousSchool: safeData.previousSchool ? safeData.previousSchool.trim() : '',
    status: safeData.status || 'Active',
    avatar: safeData.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    // DO NOT fabricate academic results during admission
    attendanceRate: null,
    gpa: null,
    academicHistory: [],
  };

  return { isValid: true, errors: {}, normalizedStudent };
}

/**
 * Student Profile Updater
 * Safely updates student fields while preserving academicHistory, past roll numbers, and past records.
 */
export function updateStudentProfile({ studentId, updatedFields = {}, currentStudents = [] }) {
  if (!studentId) {
    return { success: false, error: 'Student ID is required', updatedStudents: currentStudents };
  }

  const studentIndex = currentStudents.findIndex(s => s.id === studentId);
  if (studentIndex === -1) {
    return { success: false, error: `Student with ID '${studentId}' not found`, updatedStudents: currentStudents };
  }

  const existingStudent = currentStudents[studentIndex];
  const preservedHistory = Array.isArray(existingStudent.academicHistory) ? existingStudent.academicHistory : [];

  const updatedStudent = {
    ...existingStudent,
    ...updatedFields,
    id: existingStudent.id, // Immutable ID
    academicHistory: updatedFields.academicHistory !== undefined
      ? updatedFields.academicHistory
      : preservedHistory,
  };

  const updatedStudents = currentStudents.map((s, idx) => (idx === studentIndex ? updatedStudent : s));
  return { success: true, updatedStudents, updatedStudent };
}

/**
 * Batch Promotion Validator
 * Evaluates candidate eligibility, destination validity, and duplicate enrollments.
 */
export function validateBatchPromotion({
  studentIds = [],
  sourceGrade = null,
  sourceSection = null,
  sourceAcademicYear = null,
  targetAcademicYear,
  targetGrade,
  targetSection,
  students = [],
}) {
  if (!Array.isArray(studentIds) || studentIds.length === 0) {
    return { isValid: false, error: 'Please select at least one student to promote.' };
  }

  // Reject duplicate IDs in the request
  const uniqueIds = new Set(studentIds);
  if (uniqueIds.size !== studentIds.length) {
    return { isValid: false, error: 'Duplicate student IDs found in promotion request.' };
  }

  // Target destination validation
  if (!targetGrade || !targetSection) {
    return { isValid: false, error: 'Target Grade and Section are required.' };
  }
  if (!targetAcademicYear) {
    return { isValid: false, error: 'Target Academic Year is required.' };
  }

  const targetYearId = getAcademicYearId(targetAcademicYear);

  // Validate student records
  const selectedStudents = [];
  for (const id of studentIds) {
    const student = students.find(s => s.id === id);
    if (!student) {
      return { isValid: false, error: `Student with ID '${id}' not found in records.` };
    }

    // Ineligible statuses
    if (student.status === 'Withdrawn') {
      return { isValid: false, error: `Student ${student.name} is Withdrawn and ineligible for promotion.` };
    }
    if (student.status === 'Graduated') {
      return { isValid: false, error: `Student ${student.name} is already Graduated and ineligible for promotion.` };
    }

    // Source cohort check if specified
    if (sourceGrade && student.grade !== sourceGrade) {
      return { isValid: false, error: `Student ${student.name} does not belong to source grade ${sourceGrade}.` };
    }
    if (sourceSection && sourceSection !== 'All' && student.section !== sourceSection) {
      return { isValid: false, error: `Student ${student.name} does not belong to source section ${sourceSection}.` };
    }
    if (sourceAcademicYear && !areAcademicYearsEqual(student.academicYear, sourceAcademicYear)) {
      return { isValid: false, error: `Student ${student.name} does not belong to source academic year ${getAcademicYearName(sourceAcademicYear)}.` };
    }

    // Destination duplicate enrollment check
    const isAlreadyEnrolled =
      student.grade === targetGrade &&
      student.section === targetSection &&
      areAcademicYearsEqual(student.academicYear, targetYearId);

    if (isAlreadyEnrolled) {
      return {
        isValid: false,
        error: `Cannot promote: ${student.name} is already actively enrolled in ${targetGrade} (${targetSection}) for ${getAcademicYearName(targetYearId)}. Duplicate target enrollment prevented.`,
      };
    }

    selectedStudents.push(student);
  }

  return { isValid: true, error: null, selectedStudents };
}

/**
 * Batch Academic Promotion Executor
 * Atomically promotes eligible students, generates collision-free roll numbers,
 * and archives the previous enrollment into academicHistory.
 */
export function executeBatchPromotion({
  studentIds = [],
  sourceGrade = null,
  sourceSection = null,
  sourceAcademicYear = null,
  targetAcademicYear,
  targetGrade,
  targetSection,
  students = [],
  currentAcademicYear = 'ay-2026',
}) {
  const validation = validateBatchPromotion({
    studentIds,
    sourceGrade,
    sourceSection,
    sourceAcademicYear,
    targetAcademicYear,
    targetGrade,
    targetSection,
    students,
  });

  if (!validation.isValid) {
    return { success: false, error: validation.error, updatedStudents: students };
  }

  const targetYearId = getAcademicYearId(targetAcademicYear);
  const sectionPrefix = (targetSection.split(' ')[0] || 'SEC').replace(/[^a-zA-Z0-9]/g, '');

  // Find existing roll numbers in target section (excluding the students being promoted)
  const existingTargetRolls = new Set(
    students
      .filter(s => s.section === targetSection && !studentIds.includes(s.id) && s.status !== 'Withdrawn')
      .map(s => String(s.rollNo || '').toUpperCase())
      .filter(Boolean)
  );

  // Allocate unique roll numbers sequentially
  let rollCounter = 1;
  const assignedRolls = {};
  for (const id of studentIds) {
    let candidate = `${sectionPrefix}-${String(rollCounter).padStart(2, '0')}`;
    while (existingTargetRolls.has(candidate.toUpperCase())) {
      rollCounter++;
      candidate = `${sectionPrefix}-${String(rollCounter).padStart(2, '0')}`;
    }
    existingTargetRolls.add(candidate.toUpperCase());
    assignedRolls[id] = candidate;
    rollCounter++;
  }

  const promotedDate = new Date().toISOString().slice(0, 10);

  // Atomically update students
  const updatedStudents = students.map(s => {
    if (!studentIds.includes(s.id)) return s;

    const previousHistory = Array.isArray(s.academicHistory) ? s.academicHistory : [];
    const historySnapshot = {
      academicYear: s.academicYear || currentAcademicYear,
      academicYearName: getAcademicYearName(s.academicYear || currentAcademicYear),
      grade: s.grade,
      section: s.section,
      rollNo: s.rollNo || 'N/A',
      gpa: s.gpa !== undefined && s.gpa !== null ? s.gpa : null,
      attendanceRate: s.attendanceRate !== undefined && s.attendanceRate !== null ? s.attendanceRate : null,
      status: 'Promoted',
      promotedAt: promotedDate,
    };

    return {
      ...s,
      academicYear: targetYearId,
      grade: targetGrade,
      section: targetSection,
      rollNo: assignedRolls[s.id] || s.rollNo,
      academicHistory: [historySnapshot, ...previousHistory],
      status: 'Active',
    };
  });

  return {
    success: true,
    count: studentIds.length,
    updatedStudents,
    assignedRolls,
  };
}

/**
 * Safe Directory Search and Filtering
 */
export function filterStudents({
  students = [],
  searchTerm = '',
  grade = 'All',
  section = 'All',
  status = 'All',
  academicYear = 'All',
}) {
  const query = (searchTerm || '').trim().toLowerCase();

  return students.filter(s => {
    if (!s) return false;

    // Search query matching across safe strings
    if (query) {
      const name = String(s.name || '').toLowerCase();
      const id = String(s.id || '').toLowerCase();
      const rollNo = String(s.rollNo || '').toLowerCase();
      const guardian = String(s.guardianName || '').toLowerCase();
      const email = String(s.email || '').toLowerCase();

      const matchesSearch =
        name.includes(query) ||
        id.includes(query) ||
        rollNo.includes(query) ||
        guardian.includes(query) ||
        email.includes(query);

      if (!matchesSearch) return false;
    }

    // Grade filter
    if (grade !== 'All' && s.grade !== grade) return false;

    // Section filter
    if (section !== 'All' && s.section !== section) return false;

    // Status filter
    if (status !== 'All' && s.status !== status) return false;

    // Academic Year filter
    if (academicYear !== 'All') {
      if (!areAcademicYearsEqual(s.academicYear, academicYear)) return false;
    }

    return true;
  });
}

/**
 * Predictable Sorting Supporting Missing Values
 */
export function sortStudents({ students = [], sortColumn = 'name', sortDirection = 'asc' }) {
  const factor = sortDirection === 'asc' ? 1 : -1;

  return [...students].sort((a, b) => {
    let valA = a[sortColumn];
    let valB = b[sortColumn];

    // Push null or undefined values to the end regardless of direction
    if (valA === null || valA === undefined || valA === '') return 1;
    if (valB === null || valB === undefined || valB === '') return -1;

    // Numeric comparison for GPA and Attendance
    if (sortColumn === 'gpa' || sortColumn === 'attendanceRate') {
      const numA = parseFloat(valA);
      const numB = parseFloat(valB);
      if (isNaN(numA)) return 1;
      if (isNaN(numB)) return -1;
      return (numA - numB) * factor;
    }

    // String comparison
    return String(valA).localeCompare(String(valB)) * factor;
  });
}

/**
 * Client-Side Pagination with Clamping
 */
export function paginateStudents({ students = [], page = 1, pageSize = 10 }) {
  const total = students.length;
  const size = Math.max(1, Number(pageSize) || 10);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const validPage = Math.min(Math.max(1, Number(page) || 1), totalPages);

  const startIndex = (validPage - 1) * size;
  const paginatedList = students.slice(startIndex, startIndex + size);

  return {
    paginatedList,
    currentPage: validPage,
    totalPages,
    totalRecords: total,
    startIndex,
    endIndex: Math.min(startIndex + size, total),
  };
}

/**
 * Proper CSV Export with Escaping
 */
export function exportStudentsToCSV(students = []) {
  const headers = ['ID', 'Roll No', 'Name', 'Grade', 'Section', 'Academic Year', 'Guardian', 'Phone', 'Email', 'Status', 'Attendance Rate', 'GPA'];

  const escapeCSV = (value) => {
    if (value === null || value === undefined) return '""';
    const str = String(value).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = students.map(s => [
    escapeCSV(s.id),
    escapeCSV(s.rollNo || ''),
    escapeCSV(s.name),
    escapeCSV(s.grade),
    escapeCSV(s.section),
    escapeCSV(getAcademicYearName(s.academicYear)),
    escapeCSV(s.guardianName || ''),
    escapeCSV(s.guardianPhone || ''),
    escapeCSV(s.email || ''),
    escapeCSV(s.status || 'Active'),
    escapeCSV(s.attendanceRate !== null && s.attendanceRate !== undefined ? `${s.attendanceRate}%` : 'N/A'),
    escapeCSV(s.gpa !== null && s.gpa !== undefined ? s.gpa : 'N/A'),
  ].join(','));

  return [headers.join(','), ...rows].join('\n');
}

/**
 * Section-Specific Attendance Batch Submission
 */
export function submitSectionAttendance({ section, attendanceRecords = [], students = [] }) {
  if (!section) {
    return { success: false, error: 'Section is required for batch attendance submission.' };
  }

  // Get active students enrolled in this section
  const sectionStudents = new Set(
    students
      .filter(s => s.section === section && s.status !== 'Withdrawn')
      .map(s => s.id)
  );

  // Filter attendance records specifically belonging to students of this section
  const sectionAttendance = attendanceRecords.filter(a => sectionStudents.has(a.studentId));
  const absentRecords = sectionAttendance.filter(a => a.status === 'Absent');

  return {
    success: true,
    section,
    total: sectionAttendance.length,
    absentCount: absentRecords.length,
    absentRecords,
    sectionAttendance,
  };
}

/**
 * Continuous Assessment Grade Calculator
 * Exact weighting: Quiz 1 (15%), Midterm (35%), Project (20%), Final Exam (30%).
 */
export function calculateWeightedScore({ quiz1 = 0, midterm = 0, project = 0, finalExam = 0 }) {
  const q = Math.min(100, Math.max(0, Number(quiz1) || 0));
  const m = Math.min(100, Math.max(0, Number(midterm) || 0));
  const p = Math.min(100, Math.max(0, Number(project) || 0));
  const f = Math.min(100, Math.max(0, Number(finalExam) || 0));

  const total = q * 0.15 + m * 0.35 + p * 0.20 + f * 0.30;
  return Math.round(total * 10) / 10;
}

export function deriveLetterGrade(weightedScore) {
  if (weightedScore === null || weightedScore === undefined || isNaN(weightedScore)) return 'N/A';
  if (weightedScore >= 93) return 'A+';
  if (weightedScore >= 85) return 'A';
  if (weightedScore >= 75) return 'B';
  if (weightedScore >= 65) return 'C';
  if (weightedScore >= 50) return 'D';
  return 'F';
}

export function updateGradeRecord({ grades = [], studentId, field, rawValue, subject = null }) {
  const numVal = Math.min(100, Math.max(0, Number(rawValue) || 0));

  const updatedGrades = grades.map(item => {
    // Match by studentId, and subject if specified
    const matchesSubject = !subject || item.subject === subject;
    if (item.studentId === studentId && matchesSubject) {
      const updated = { ...item, [field]: numVal };
      const weightedScore = calculateWeightedScore({
        quiz1: updated.quiz1,
        midterm: updated.midterm,
        project: updated.project,
        finalExam: updated.finalExam,
      });
      const letterGrade = deriveLetterGrade(weightedScore);
      return {
        ...updated,
        weightedScore,
        letterGrade,
      };
    }
    return item;
  });

  return updatedGrades;
}

/**
 * Invoice Settlement Handler
 * Prevents repeated invoice settlement and duplicate receipts.
 */
export function settleInvoice({ invoiceId, invoices = [], receiptNo = null }) {
  const targetInvoice = invoices.find(inv => inv.id === invoiceId);
  if (!targetInvoice) {
    return { success: false, error: `Invoice '${invoiceId}' not found`, updatedInvoices: invoices, isNewPayment: false };
  }

  // Idempotency: If already paid, do not generate duplicate receipts
  if (targetInvoice.status === 'Paid') {
    return {
      success: true,
      error: 'Invoice is already settled.',
      updatedInvoices: invoices,
      settledInvoice: targetInvoice,
      isNewPayment: false,
    };
  }

  const generatedReceipt = receiptNo || `REC-${Math.floor(1000 + Math.random() * 9000)}-OK`;
  const settledInvoice = {
    ...targetInvoice,
    status: 'Paid',
    paymentDate: new Date().toISOString().slice(0, 10),
    receipt: generatedReceipt,
  };

  const updatedInvoices = invoices.map(inv => (inv.id === invoiceId ? settledInvoice : inv));

  return {
    success: true,
    updatedInvoices,
    settledInvoice,
    isNewPayment: true,
  };
}
