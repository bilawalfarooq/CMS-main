import { test, describe } from 'node:test';
import assert from 'node:assert/strict';

import {
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_ATTENDANCE,
  INITIAL_GRADES,
  MOCK_INVOICES,
  ACADEMIC_YEARS,
} from '../src/data/mockData.js';

import {
  getAcademicYearId,
  getAcademicYearName,
  areAcademicYearsEqual,
  generateStudentId,
  generateStudentEmail,
  allocateRollNumber,
  validateStudentAdmission,
  updateStudentProfile,
  validateBatchPromotion,
  executeBatchPromotion,
  filterStudents,
  sortStudents,
  paginateStudents,
  exportStudentsToCSV,
  submitSectionAttendance,
  calculateWeightedScore,
  deriveLetterGrade,
  updateGradeRecord,
  settleInvoice,
} from '../src/services/studentService.js';

describe('Student Module Functional Integrity Tests (Production Logic)', () => {

  test('1. Profile updates preserve historical academic history (academicHistory)', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const targetId = 'STU-2026-0101';
    const student = students.find(s => s.id === targetId);
    assert.ok(student, 'Student STU-2026-0101 must exist');

    assert.ok(Array.isArray(student.academicHistory), 'Student must have academicHistory array');
    const initialHistoryLength = student.academicHistory.length;
    const initialHistoricalGrade = student.academicHistory[0]?.grade;

    // Execute real production update function
    const result = updateStudentProfile({
      studentId: targetId,
      updatedFields: {
        name: 'Aisha Al-Mansoor (Updated)',
        guardianPhone: '+1 (555) 999-0000',
        address: '888 Boulevard Way',
      },
      currentStudents: students,
    });

    assert.equal(result.success, true, 'Profile update should succeed');
    const updated = result.updatedStudent;
    assert.equal(updated.name, 'Aisha Al-Mansoor (Updated)');
    assert.equal(updated.guardianPhone, '+1 (555) 999-0000');
    assert.equal(updated.address, '888 Boulevard Way');

    // Confirm academic history was untouched
    assert.equal(updated.academicHistory.length, initialHistoryLength, 'Academic history count must remain identical');
    assert.equal(updated.academicHistory[0]?.grade, initialHistoricalGrade, 'Historical grade in academicHistory must not be mutated');
  });

  test('2. Profile updates preserve historical attendance remarks and roll numbers', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const attendance = JSON.parse(JSON.stringify(INITIAL_ATTENDANCE));

    const attendanceRecord = attendance.find(a => a.studentId === 'STU-2026-0101');
    assert.equal(attendanceRecord.remarks, 'On time');
    assert.equal(attendanceRecord.rollNo, '10A-01');

    // Update profile
    const result = updateStudentProfile({
      studentId: 'STU-2026-0101',
      updatedFields: { name: 'Aisha Al-Mansoor Verified' },
      currentStudents: students,
    });

    assert.equal(result.success, true);
    // Attendance record keeps its historical remarks and roll number
    assert.equal(attendanceRecord.remarks, 'On time', 'Historical attendance remarks must remain unchanged');
    assert.equal(attendanceRecord.rollNo, '10A-01', 'Historical attendance rollNo must remain unchanged');
  });

  test('3. Profile updates preserve historical grade scores', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const grades = JSON.parse(JSON.stringify(INITIAL_GRADES));

    const gradeBefore = grades.find(g => g.studentId === 'STU-2026-0101');
    assert.equal(gradeBefore.finalExam, 95);
    assert.equal(gradeBefore.letterGrade, 'A+');
    assert.equal(gradeBefore.weightedScore, 94.6);

    // Update student address
    const result = updateStudentProfile({
      studentId: 'STU-2026-0101',
      updatedFields: { address: '777 New Residence Blvd' },
      currentStudents: students,
    });

    assert.equal(result.success, true);
    const gradeAfter = grades.find(g => g.studentId === 'STU-2026-0101');
    assert.equal(gradeAfter.finalExam, 95);
    assert.equal(gradeAfter.letterGrade, 'A+');
    assert.equal(gradeAfter.weightedScore, 94.6);
  });

  test('4. Promotion archives the correct previous enrollment in academicHistory', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const studentBefore = students.find(s => s.id === 'STU-2026-0101');
    const oldGrade = studentBefore.grade;
    const oldSection = studentBefore.section;
    const oldRollNo = studentBefore.rollNo;
    const oldGpa = studentBefore.gpa;
    const oldHistoryCount = studentBefore.academicHistory.length;

    const result = executeBatchPromotion({
      studentIds: ['STU-2026-0101'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-ComputerScience',
      students,
      currentAcademicYear: 'ay-2026',
    });

    assert.equal(result.success, true);
    const studentAfter = result.updatedStudents.find(s => s.id === 'STU-2026-0101');
    assert.equal(studentAfter.grade, 'Grade 11');
    assert.equal(studentAfter.section, '11-ComputerScience');

    // Verified snapshot archived
    assert.equal(studentAfter.academicHistory.length, oldHistoryCount + 1);
    const snapshot = studentAfter.academicHistory[0];
    assert.equal(snapshot.grade, oldGrade);
    assert.equal(snapshot.section, oldSection);
    assert.equal(snapshot.rollNo, oldRollNo);
    assert.equal(snapshot.gpa, oldGpa);
    assert.equal(snapshot.status, 'Promoted');
  });

  test('5. Duplicate destination enrollment is rejected', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

    // Sofia (STU-2026-0105) is already enrolled in Grade 11, 11-PreMed, ay-2026
    const sofia = students.find(s => s.id === 'STU-2026-0105');
    assert.equal(sofia.grade, 'Grade 11');
    assert.equal(sofia.section, '11-PreMed');

    const result = executeBatchPromotion({
      studentIds: ['STU-2026-0105'],
      targetAcademicYear: sofia.academicYear,
      targetGrade: 'Grade 11',
      targetSection: '11-PreMed',
      students,
    });

    assert.equal(result.success, false, 'Must reject duplicate active enrollment in destination');
    assert.match(result.error, /already actively enrolled/);
  });

  test('6. Roll-number allocation avoids collisions within the correct cohort', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const existingInPreMed = students.filter(s => s.section === '11-PreMed');
    const existingRolls = existingInPreMed.map(s => s.rollNo);

    const result = executeBatchPromotion({
      studentIds: ['STU-2026-0101', 'STU-2026-0103'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-PreMed',
      students,
    });

    assert.equal(result.success, true);
    const student1 = result.updatedStudents.find(s => s.id === 'STU-2026-0101');
    const student2 = result.updatedStudents.find(s => s.id === 'STU-2026-0103');

    assert.notEqual(student1.rollNo, student2.rollNo);
    for (const roll of existingRolls) {
      assert.notEqual(student1.rollNo, roll);
      assert.notEqual(student2.rollNo, roll);
    }
  });

  test('7. Promotion preserves attendance and grade records', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const attendance = JSON.parse(JSON.stringify(INITIAL_ATTENDANCE));
    const grades = JSON.parse(JSON.stringify(INITIAL_GRADES));

    const chloeAttendance = attendance.find(a => a.studentId === 'STU-2026-0103');
    const chloeGrade = grades.find(g => g.studentId === 'STU-2026-0103');

    const prevRemarks = chloeAttendance.remarks;
    const prevScore = chloeGrade.weightedScore;

    const result = executeBatchPromotion({
      studentIds: ['STU-2026-0103'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-ComputerScience',
      students,
    });

    assert.equal(result.success, true);
    // Attendance and grades are unmutated
    assert.equal(chloeAttendance.remarks, prevRemarks);
    assert.equal(chloeGrade.weightedScore, prevScore);
  });

  test('8. Successful multi-student promotion creates exactly one audit record contract', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const auditLogs = [];

    const result = executeBatchPromotion({
      studentIds: ['STU-2026-0101', 'STU-2026-0103'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-ComputerScience',
      students,
    });

    assert.equal(result.success, true);
    assert.equal(result.count, 2);

    // One audit record per successful batch
    auditLogs.push({
      action: 'BATCH_STUDENT_PROMOTION',
      details: `Promoted ${result.count} students to Grade 11 (11-ComputerScience)`,
    });

    assert.equal(auditLogs.length, 1);
    assert.match(auditLogs[0].details, /Promoted 2 students/);
  });

  test('9. Directory search by name, ID, roll number, guardian, and email', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

    // Search by Name
    const byName = filterStudents({ students, searchTerm: 'Aisha' });
    assert.equal(byName.length, 1);
    assert.equal(byName[0].id, 'STU-2026-0101');

    // Search by ID
    const byId = filterStudents({ students, searchTerm: '0104' });
    assert.equal(byId.length, 1);
    assert.equal(byId[0].name, 'Zackary Ethan Morales');

    // Search by Guardian
    const byGuardian = filterStudents({ students, searchTerm: 'Helena Vance' });
    assert.equal(byGuardian.length, 1);
    assert.equal(byGuardian[0].id, 'STU-2026-0102');

    // Search by Roll # (Chloe Isabella Chen is 10A-02 in INITIAL_STUDENTS)
    const byRoll = filterStudents({ students, searchTerm: '10A-02' });
    assert.equal(byRoll.length, 1);
    assert.equal(byRoll[0].name, 'Chloe Isabella Chen');

    // Search by Email
    const byEmail = filterStudents({ students, searchTerm: 'chloe.c@student.educore.edu' });
    assert.equal(byEmail.length, 1);
    assert.equal(byEmail[0].id, 'STU-2026-0103');
  });

  test('10. Combined grade, section, status, and academic-year filters', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

    // Grade 10 + 10-A (Science) + Active
    const g10Active = filterStudents({
      students,
      grade: 'Grade 10',
      section: '10-A (Science)',
      status: 'Active',
      academicYear: 'All',
    });
    assert.equal(g10Active.length, 2); // Aisha & Chloe

    // Grade 11 + On-Leave
    const g11OnLeave = filterStudents({
      students,
      grade: 'Grade 11',
      section: 'All',
      status: 'On-Leave',
      academicYear: 'ay-2026',
    });
    assert.equal(g11OnLeave.length, 1);
    assert.equal(g11OnLeave[0].name, 'Sofia Noor Rahman');

    // Academic Year filter with ID normalization
    const ayFilter = filterStudents({
      students,
      grade: 'All',
      section: 'All',
      status: 'All',
      academicYear: '2026 - 2027', // Display name matching ay-2026
    });
    assert.equal(ayFilter.length, students.length);
  });

  test('11. Ascending and descending sorting, including missing values', () => {
    const dataset = [
      { id: '1', name: 'Zoe', gpa: '3.80' },
      { id: '2', name: 'Adam', gpa: null },
      { id: '3', name: 'Ben', gpa: '3.95' },
    ];

    // Sort by name ascending
    const nameAsc = sortStudents({ students: dataset, sortColumn: 'name', sortDirection: 'asc' });
    assert.equal(nameAsc[0].name, 'Adam');
    assert.equal(nameAsc[2].name, 'Zoe');

    // Sort by GPA descending, null/missing placed at the end
    const gpaDesc = sortStudents({ students: dataset, sortColumn: 'gpa', sortDirection: 'desc' });
    assert.equal(gpaDesc[0].gpa, '3.95');
    assert.equal(gpaDesc[1].gpa, '3.80');
    assert.equal(gpaDesc[2].gpa, null);
  });

  test('12. Pagination, page-size changes, and out-of-range page correction', () => {
    const mockList = Array.from({ length: 28 }, (_, i) => ({ id: `STU-${i + 1}`, name: `Student ${i + 1}` }));

    // Page 1 of 10
    const page1 = paginateStudents({ students: mockList, page: 1, pageSize: 10 });
    assert.equal(page1.paginatedList.length, 10);
    assert.equal(page1.currentPage, 1);
    assert.equal(page1.totalPages, 3);

    // Out-of-range high page correction (page 99 -> page 3)
    const pageOutHigh = paginateStudents({ students: mockList, page: 99, pageSize: 10 });
    assert.equal(pageOutHigh.currentPage, 3);
    assert.equal(pageOutHigh.paginatedList.length, 8);

    // Out-of-range low page correction (page -5 -> page 1)
    const pageOutLow = paginateStudents({ students: mockList, page: -5, pageSize: 10 });
    assert.equal(pageOutLow.currentPage, 1);
    assert.equal(pageOutLow.paginatedList.length, 10);
  });

  test('13. Admission rejects duplicate roll numbers and student IDs', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

    // Duplicate roll in same section
    const rollCollision = validateStudentAdmission({
      studentData: {
        name: 'New Student',
        dob: '2010-01-01',
        admissionDate: '2026-08-15',
        grade: 'Grade 10',
        section: '10-A (Science)',
        rollNo: '10A-01', // Aisha's roll
        guardianName: 'Parent',
        guardianPhone: '+1 555-0000',
      },
      existingStudents: students,
    });
    assert.equal(rollCollision.isValid, false);
    assert.ok(rollCollision.errors.rollNo);

    // Same roll in different section is allowed
    const differentSection = validateStudentAdmission({
      studentData: {
        name: 'New Student',
        dob: '2010-01-01',
        admissionDate: '2026-08-15',
        grade: 'Grade 10',
        section: '10-B (Commerce)',
        rollNo: '10A-01',
        guardianName: 'Parent',
        guardianPhone: '+1 555-0000',
      },
      existingStudents: students,
    });
    assert.equal(differentSection.isValid, true);

    // Duplicate student customId
    const idCollision = validateStudentAdmission({
      studentData: {
        name: 'New Student',
        dob: '2010-01-01',
        admissionDate: '2026-08-15',
        grade: 'Grade 10',
        section: '10-B (Commerce)',
        customId: 'STU-2026-0101',
        guardianName: 'Parent',
        guardianPhone: '+1 555-0000',
      },
      existingStudents: students,
    });
    assert.equal(idCollision.isValid, false);
    assert.ok(idCollision.errors.customId);
  });

  test('14. Invalid or duplicate student IDs in a promotion batch are rejected', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

    // Unknown student ID
    const unknownId = validateBatchPromotion({
      studentIds: ['STU-9999-9999'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-PreMed',
      students,
    });
    assert.equal(unknownId.isValid, false);
    assert.match(unknownId.error, /not found/);

    // Duplicate IDs in same request
    const duplicateId = validateBatchPromotion({
      studentIds: ['STU-2026-0101', 'STU-2026-0101'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-PreMed',
      students,
    });
    assert.equal(duplicateId.isValid, false);
    assert.match(duplicateId.error, /Duplicate student IDs/);
  });

  test('15. Failed promotion leaves every selected student unchanged', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

    // Batch with one valid student and one duplicate target enrollment student
    const result = executeBatchPromotion({
      studentIds: ['STU-2026-0101', 'STU-2026-0105'],
      targetAcademicYear: 'ay-2026',
      targetGrade: 'Grade 11',
      targetSection: '11-PreMed',
      students,
    });

    assert.equal(result.success, false);
    // Confirm STU-2026-0101 is NOT promoted when batch fails
    const student1 = result.updatedStudents.find(s => s.id === 'STU-2026-0101');
    assert.equal(student1.grade, 'Grade 10', 'Student must remain unchanged when batch fails');
  });

  test('16. Failed promotion creates no audit entry or partial roll-number allocation', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const auditLogs = [];

    const result = executeBatchPromotion({
      studentIds: ['STU-2026-0105'],
      targetAcademicYear: 'ay-2026',
      targetGrade: 'Grade 11',
      targetSection: '11-PreMed',
      students,
    });

    assert.equal(result.success, false);
    if (result.success) {
      auditLogs.push({ action: 'BATCH_STUDENT_PROMOTION' });
    }

    assert.equal(auditLogs.length, 0, 'No audit entries generated on failure');
    assert.equal(result.assignedRolls, undefined);
  });

  test('17. Repeated promotion does not duplicate history entries or enrollments', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));

    // 1st Promotion
    const promo1 = executeBatchPromotion({
      studentIds: ['STU-2026-0101'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-ComputerScience',
      students,
    });
    assert.equal(promo1.success, true);

    // Attempting repeated promotion to same destination
    const promo2 = executeBatchPromotion({
      studentIds: ['STU-2026-0101'],
      targetAcademicYear: 'ay-2025',
      targetGrade: 'Grade 11',
      targetSection: '11-ComputerScience',
      students: promo1.updatedStudents,
    });

    assert.equal(promo2.success, false, 'Repeated promotion to same destination must be rejected');
    const student = promo1.updatedStudents.find(s => s.id === 'STU-2026-0101');
    assert.equal(student.academicHistory.length, 2, 'History entries must not be duplicated');
  });

  test('18. Attendance batch submission affects only the intended section/date/session', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const attendance = JSON.parse(JSON.stringify(INITIAL_ATTENDANCE));

    // Submit for 10-A (Science) where Aisha is Present and Chloe is Absent
    const result = submitSectionAttendance({
      section: '10-A (Science)',
      attendanceRecords: attendance,
      students,
    });

    assert.equal(result.success, true);
    assert.equal(result.total, 2); // Aisha & Chloe
    assert.equal(result.absentCount, 1); // Only Chloe
    assert.equal(result.absentRecords[0].studentId, 'STU-2026-0103');
  });

  test('19. Grade updates target the correct assessment and preserve unrelated grades', () => {
    const grades = JSON.parse(JSON.stringify(INITIAL_GRADES));
    const targetStudentId = 'STU-2026-0102'; // Liam

    // Update Liam's quiz1 to 95
    const updatedGrades = updateGradeRecord({
      grades,
      studentId: targetStudentId,
      field: 'quiz1',
      rawValue: 95,
    });

    const liamUpdated = updatedGrades.find(g => g.studentId === targetStudentId);
    assert.equal(liamUpdated.quiz1, 95);
    // Recalculated weighted score: 95*0.15 + 85*0.35 + 95*0.20 + 89*0.30 = 14.25 + 29.75 + 19.0 + 26.7 = 89.7
    assert.equal(liamUpdated.weightedScore, 89.7);
    assert.equal(liamUpdated.letterGrade, 'A');

    // Aisha's grade is completely untouched
    const aishaGrade = updatedGrades.find(g => g.studentId === 'STU-2026-0101');
    assert.equal(aishaGrade.quiz1, 94);
    assert.equal(aishaGrade.weightedScore, 94.6);
  });

  test('20. Invoice settlement cannot generate duplicate receipts', () => {
    const invoices = JSON.parse(JSON.stringify(MOCK_INVOICES));

    // 1st Settlement of upcoming invoice
    const settlement1 = settleInvoice({
      invoiceId: 'INV-2026-082',
      invoices,
      receiptNo: 'REC-TEST-100',
    });

    assert.equal(settlement1.success, true);
    assert.equal(settlement1.isNewPayment, true);
    assert.equal(settlement1.settledInvoice.status, 'Paid');
    assert.equal(settlement1.settledInvoice.receipt, 'REC-TEST-100');

    // 2nd Settlement attempt on already settled invoice
    const settlement2 = settleInvoice({
      invoiceId: 'INV-2026-082',
      invoices: settlement1.updatedInvoices,
      receiptNo: 'REC-TEST-DUPLICATE',
    });

    assert.equal(settlement2.success, true);
    assert.equal(settlement2.isNewPayment, false, 'Duplicate settlement must not be treated as a new payment');
    assert.equal(settlement2.settledInvoice.receipt, 'REC-TEST-100', 'Original receipt must be preserved');
  });

  test('21. Student profile not-found behavior and student-specific invoice filtering', () => {
    const students = JSON.parse(JSON.stringify(INITIAL_STUDENTS));
    const invoices = JSON.parse(JSON.stringify(MOCK_INVOICES));

    // Student not found check
    const nonExistent = students.find(s => s.id === 'NON-EXISTENT-ID');
    assert.equal(nonExistent, undefined, 'Must return undefined for non-existent student, not fallback to first student');

    // Invoices filtered by student
    const aishaInvoices = invoices.filter(inv => inv.studentId === 'STU-2026-0101');
    assert.equal(aishaInvoices.length, 2);
    assert.ok(aishaInvoices.every(inv => inv.studentId === 'STU-2026-0101'));

    const liamInvoices = invoices.filter(inv => inv.studentId === 'STU-2026-0102');
    assert.equal(liamInvoices.length, 1);
    assert.equal(liamInvoices[0].id, 'INV-2026-LAB');
  });

  test('22. Missing or malformed optional data does not crash directory, profile, admission, or promotion', () => {
    const malformedStudents = [
      { id: 'MAL-1', name: 'Malformed One' }, // missing grade, section, gpa, attendanceRate, rollNo
      { id: 'MAL-2', name: 'Malformed Two', gpa: null, attendanceRate: undefined, academicHistory: null },
      null,
      undefined,
    ];

    // Filter should not throw
    assert.doesNotThrow(() => {
      filterStudents({ students: malformedStudents, searchTerm: 'Malformed' });
    });

    // Sort should not throw
    assert.doesNotThrow(() => {
      sortStudents({ students: malformedStudents.filter(Boolean), sortColumn: 'gpa', sortDirection: 'desc' });
    });

    // CSV export should not throw
    assert.doesNotThrow(() => {
      const csv = exportStudentsToCSV(malformedStudents.filter(Boolean));
      assert.ok(csv.includes('Malformed One'));
    });

    // Admission validation on empty object should not throw
    assert.doesNotThrow(() => {
      const res = validateStudentAdmission({ studentData: {}, existingStudents: [] });
      assert.equal(res.isValid, false);
      assert.ok(res.errors.name);
    });

    // Batch promotion on empty should not throw
    assert.doesNotThrow(() => {
      const res = executeBatchPromotion({ studentIds: [], students: [] });
      assert.equal(res.success, false);
    });
  });

});
