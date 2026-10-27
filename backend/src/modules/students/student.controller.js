import * as studentService from './student.service.js';
import { successResponse, paginatedResponse, errorResponse } from '../../utils/apiResponse.js';

export async function listStudents(req, res, next) {
  try {
    const {
      search,
      grade,
      section,
      status,
      academicYear,
      sortField,
      sortOrder,
      page = 1,
      pageSize = 10,
    } = req.query;

    const result = await studentService.getStudents({
      search,
      grade,
      section,
      status,
      academicYear,
      sortField,
      sortOrder,
      page,
      pageSize,
    });

    return paginatedResponse(res, result.students, {
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    });
  } catch (err) {
    next(err);
  }
}

export async function getStudent(req, res, next) {
  try {
    const { id } = req.params;
    const student = await studentService.getStudentById(id);
    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }
    return successResponse(res, student);
  } catch (err) {
    next(err);
  }
}

export async function createAdmission(req, res, next) {
  try {
    const actor = req.user?.name || 'Registrar Staff';
    const student = await studentService.createStudentAdmission(req.body, actor);
    return successResponse(res, student, 'Student admitted successfully', 201);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
}

export async function bulkImport(req, res, next) {
  try {
    const actor = req.user?.name || 'Registrar Staff';
    const { students = [] } = req.body;
    const result = await studentService.bulkImportStudents(students, actor);
    return successResponse(res, result, `Ingested ${result.count} student records via CSV batch`, 201);
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(req, res, next) {
  try {
    const { id } = req.params;
    const actor = req.user?.name || 'Registrar Staff';
    const updated = await studentService.updateStudentProfile(id, req.body, actor);
    return successResponse(res, updated, 'Student profile updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
}

export async function updateStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const actor = req.user?.name || 'Super Admin';
    const result = await studentService.updateStudentStatus(id, status, reason, actor);
    return successResponse(res, result, `Student status updated to ${status}`);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
}

export async function deleteStudent(req, res, next) {
  try {
    const { id } = req.params;
    const actor = req.user?.name || 'Super Admin';
    const result = await studentService.deleteStudent(id, actor);
    return successResponse(res, result, 'Student record removed from enrollment');
  } catch (err) {
    next(err);
  }
}

export async function promote(req, res, next) {
  try {
    const actor = req.user?.name || 'Dean Vance (Principal)';
    const result = await studentService.executeBatchPromotion({
      ...req.body,
      actor,
    });
    return successResponse(res, result, `Successfully promoted ${result.count} students`);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
}

export async function exportCSV(req, res, next) {
  try {
    const result = await studentService.getStudents({
      ...req.query,
      page: 1,
      pageSize: 1000,
    });

    const headers = [
      'Student ID',
      'Full Legal Name',
      'Grade',
      'Section',
      'Roll Number',
      'Academic Year',
      'Status',
      'GPA',
      'Attendance Rate',
      'Guardian Name',
      'Guardian Phone',
      'Guardian Email',
    ];

    const escapeCSV = (val) => {
      if (val === null || val === undefined) return '';
      const str = String(val);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = result.students.map((s) => [
      escapeCSV(s.id),
      escapeCSV(s.name),
      escapeCSV(s.grade),
      escapeCSV(s.section),
      escapeCSV(s.rollNo),
      escapeCSV(s.academicYear),
      escapeCSV(s.status),
      escapeCSV(s.gpa),
      escapeCSV(s.attendanceRate !== null ? `${s.attendanceRate}%` : ''),
      escapeCSV(s.guardianName),
      escapeCSV(s.guardianPhone),
      escapeCSV(s.guardianEmail),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="educore_student_directory_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
}
