import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Get section attendance roster
router.get('/', async (req, res, next) => {
  try {
    const { section, date, period = 'Daily Morning Roster' } = req.query;

    let targetDate = date;
    if (!targetDate) {
      const todayStr = new Date().toISOString().slice(0, 10);
      const todayCount = await prisma.attendanceRecord.count({
        where: { date: new Date(todayStr), periodName: period },
      });
      if (todayCount > 0) {
        targetDate = todayStr;
      } else {
        const latest = await prisma.attendanceRecord.findFirst({
          orderBy: { date: 'desc' },
          select: { date: true },
        });
        targetDate = latest ? latest.date.toISOString().slice(0, 10) : todayStr;
      }
    }

    const studentWhere = { status: { not: 'WITHDRAWN' } };
    if (section && section !== 'All') {
      studentWhere.section = { name: section };
    }

    // Get all enrolled students in the section (or school if section is All)
    const students = await prisma.student.findMany({
      where: studentWhere,
      select: { id: true, name: true, rollNo: true },
      orderBy: { rollNo: 'asc' },
    });

    // Query existing attendance records for targetDate and period
    const attendanceWhere = {
      date: new Date(targetDate),
      periodName: period,
    };
    if (section && section !== 'All') {
      attendanceWhere.section = { name: section };
    }

    const existingRecords = await prisma.attendanceRecord.findMany({
      where: attendanceWhere,
    });

    const recordMap = new Map(existingRecords.map((r) => [r.studentId, r]));

    const roster = students.map((s) => {
      const existing = recordMap.get(s.id);
      if (existing) {
        return {
          id: existing.id,
          studentId: s.id,
          name: s.name,
          rollNo: s.rollNo,
          status: existing.status.charAt(0) + existing.status.slice(1).toLowerCase(),
          remarks: existing.remarks || '',
        };
      }
      return {
        id: `draft-${s.id}`,
        studentId: s.id,
        name: s.name,
        rollNo: s.rollNo,
        status: 'Present',
        remarks: 'On time',
      };
    });

    return successResponse(res, roster);
  } catch (err) {
    next(err);
  }
});

// Submit batch attendance
router.post('/batch', authorize(['super_admin', 'teacher']), async (req, res, next) => {
  try {
    const {
      section: sectionName,
      date = new Date().toISOString().slice(0, 10),
      period = 'Daily Morning Roster',
      records = [],
    } = req.body;

    if (!sectionName) {
      return errorResponse(res, 'Section is required for batch attendance submission', 400);
    }

    const section = await prisma.section.findFirst({
      where: { name: sectionName },
      include: { students: true },
    });

    if (!section) {
      return errorResponse(res, `Section '${sectionName}' does not exist`, 404);
    }

    const sectionStudentIds = new Set(section.students.map((s) => s.id));
    const sectionStudentsMap = new Map(section.students.map((s) => [s.id, s]));

    // Strictly filter out any records that do not belong to this section
    const validRecords = records.filter((r) => sectionStudentIds.has(r.studentId));

    const absentRecords = [];

    await prisma.$transaction(async (tx) => {
      for (const item of validRecords) {
        const student = sectionStudentsMap.get(item.studentId);
        const statusEnum = item.status.toUpperCase();
        const remarks = item.remarks || (statusEnum === 'PRESENT' ? 'On time' : statusEnum === 'ABSENT' ? 'Absence recorded - alert required' : '');

        await tx.attendanceRecord.upsert({
          where: {
            studentId_date_periodName: {
              studentId: item.studentId,
              date: new Date(date),
              periodName: period,
            },
          },
          update: {
            status: statusEnum,
            remarks,
          },
          create: {
            studentId: item.studentId,
            academicYearId: student.academicYearId,
            sectionId: section.id,
            date: new Date(date),
            periodName: period,
            status: statusEnum,
            remarks,
            rollNo: student.rollNo,
          },
        });

        if (statusEnum === 'ABSENT') {
          absentRecords.push({
            studentId: student.id,
            name: student.name,
            rollNo: student.rollNo,
          });

          // Dispatch SMS queue alert
          await tx.queueJobRecord.create({
            data: {
              jobType: 'SMS_ALERT',
              target: '+1 (555) 441-9921',
              recipient: `Guardian of ${student.name}`,
              status: 'Queued',
              description: `Automated absence notification for ${student.name} (${sectionName})`,
            },
          });
        }
      }

      // Record Audit Log
      await tx.auditLog.create({
        data: {
          actor: req.user?.name || 'Dr. Evelyn Reed (Teacher)',
          action: 'ATTENDANCE_BATCH_SAVE',
          entity: `Submitted ${validRecords.length} attendance records for ${sectionName}. ${absentRecords.length} absence alerts dispatched.`,
          ipAddress: '127.0.0.1',
          status: 'Success',
        },
      });
    });

    return successResponse(res, {
      total: validRecords.length,
      absentCount: absentRecords.length,
      absentRecords,
    }, 'Batch Attendance Committed Successfully');
  } catch (err) {
    next(err);
  }
});

// Update individual attendance record
router.patch('/:id', authorize(['super_admin', 'teacher']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const updated = await prisma.attendanceRecord.update({
      where: { id },
      data: {
        status: status ? status.toUpperCase() : undefined,
        remarks: remarks !== undefined ? remarks : undefined,
      },
    });

    return successResponse(res, updated, 'Attendance record updated');
  } catch (err) {
    next(err);
  }
});

// Get attendance history for a single student
router.get('/student/:studentId', async (req, res, next) => {
  try {
    const { studentId } = req.params;
    const history = await prisma.attendanceRecord.findMany({
      where: { studentId },
      orderBy: { date: 'desc' },
    });

    return successResponse(res, history);
  } catch (err) {
    next(err);
  }
});

export default router;
