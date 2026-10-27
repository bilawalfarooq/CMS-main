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
    const { section, date = new Date().toISOString().slice(0, 10), period = 'Daily Morning Roster' } = req.query;

    const where = {};
    if (section && section !== 'All') {
      where.section = { name: section };
    }

    const records = await prisma.attendanceRecord.findMany({
      where: {
        ...where,
        date: new Date(date),
        periodName: period,
      },
      include: {
        student: { select: { id: true, name: true, rollNo: true } },
      },
      orderBy: { rollNo: 'asc' },
    });

    const roster = records.map((r) => ({
      id: r.id,
      studentId: r.studentId,
      name: r.student.name,
      rollNo: r.rollNo,
      status: r.status.charAt(0) + r.status.slice(1).toLowerCase(),
      remarks: r.remarks,
    }));

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
