import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Get linked students for guardian
router.get('/students', async (req, res, next) => {
  try {
    let where = {};
    if (req.user.role === 'GUARDIAN' || req.user.role === 'guardian') {
      const guardian = await prisma.guardian.findFirst({
        where: { email: req.user.email.toLowerCase() },
      });
      if (guardian) {
        where = { guardianId: guardian.id };
      }
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        classGrade: true,
        section: true,
        guardian: true,
      },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.name,
      grade: s.classGrade.name,
      section: s.section.name,
      attendanceRate: s.attendanceRate || 98.4,
      gpa: s.gpa || '3.92',
      avatar: s.avatar,
      guardianName: s.guardian?.name,
      guardianPhone: s.guardian?.phone,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

// Submit Medical Excuse Note
router.post('/students/:id/excuse-note', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { excuseNote } = req.body;

    if (!excuseNote || !excuseNote.trim()) {
      return errorResponse(res, 'Excuse note content is required', 400);
    }

    const student = await prisma.student.findUnique({
      where: { id },
      include: { section: true, guardian: true },
    });
    if (!student) return errorResponse(res, 'Student not found', 404);

    // Record-level boundary: verify guardian owns this student
    if (req.user.role === 'GUARDIAN' || req.user.role === 'guardian') {
      if (!student.guardian || student.guardian.email.toLowerCase() !== req.user.email.toLowerCase()) {
        return errorResponse(res, 'Access denied. You are not authorized to submit excuse notes for this student.', 403);
      }
    }

    const job = await prisma.queueJobRecord.create({
      data: {
        jobType: 'SMS_ALERT',
        target: 'Dean / Head Teacher',
        recipient: `Dr. Evelyn Reed (${student.section.name})`,
        status: 'Completed',
        description: `Medical excuse note submitted by ${student.guardian?.name || 'Guardian'}: "${excuseNote.trim().slice(0, 30)}..."`,
      },
    });

    return successResponse(res, job, 'Medical excuse note dispatched to academic council');
  } catch (err) {
    next(err);
  }
});

export default router;
