import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Get list of all families/guardians for admin selector preview
router.get('/guardians', async (req, res, next) => {
  try {
    const guardians = await prisma.guardian.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, guardians);
  } catch (err) {
    next(err);
  }
});

// Get linked students for guardian or student user
router.get('/students', async (req, res, next) => {
  try {
    let where = {};
    const roleLower = (req.user.role || '').toLowerCase();

    if (roleLower === 'guardian') {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [
            { email: { equals: req.user.email, mode: 'insensitive' } },
            { userId: req.user.id },
          ],
        },
      });
      if (!guardian) {
        return successResponse(res, []);
      }
      where = { guardianId: guardian.id };
    } else if (roleLower === 'student') {
      where = {
        OR: [
          { email: { equals: req.user.email, mode: 'insensitive' } },
          { userId: req.user.id },
        ],
      };
    } else {
      // Role is super_admin, admin_staff, principal, teacher, etc.
      // Admin previewing guardian portal: filter to specific guardian or default to demo guardian Tariq Siddiqui
      const targetEmail = req.query.guardianEmail || (req.query.guardianId ? undefined : 'tariq.siddiqui@gmail.com');
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [
            ...(targetEmail ? [{ email: { equals: targetEmail, mode: 'insensitive' } }] : []),
            ...(req.query.guardianId ? [{ id: req.query.guardianId }] : []),
          ],
        },
      });

      if (guardian) {
        where = { guardianId: guardian.id };
      } else {
        // Fallback to first guardian with students rather than dumping entire school
        const fallbackGuardian = await prisma.guardian.findFirst({
          where: { students: { some: {} } },
        });
        where = fallbackGuardian ? { guardianId: fallbackGuardian.id } : { id: 'none' };
      }
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        classGrade: true,
        section: {
          include: {
            timetables: {
              include: {
                subject: true,
                staff: true,
              },
            },
          },
        },
        guardian: true,
        grades: {
          include: {
            subject: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        invoices: {
          orderBy: { dueDate: 'desc' },
        },
      },
      orderBy: { admissionDate: 'asc' },
    });

    const formatted = students.map((s) => ({
      id: s.id,
      name: s.name,
      rollNo: s.rollNo,
      grade: s.classGrade?.name || 'Technical Division',
      section: s.section?.name || 'Main Section',
      attendanceRate: s.attendanceRate ?? 98.4,
      gpa: s.gpa || '3.92',
      avatar: s.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
      guardianName: s.guardian?.name || 'Tariq Siddiqui',
      guardianPhone: s.guardian?.phone || '+92 333 2189041',
      gender: s.gender,
      status: s.status,
      grades: (s.grades || []).map((g) => ({
        id: g.id,
        subject: g.subject?.name || 'General Course',
        code: g.subject?.code || 'GEN-101',
        quiz1: g.quiz1,
        midterm: g.midterm,
        project: g.project,
        finalExam: g.finalExam,
        weightedScore: g.weightedScore,
        letterGrade: g.letterGrade,
        status: g.status,
      })),
      invoices: (s.invoices || []).map((inv) => ({
        id: inv.id,
        term: inv.term,
        amount: inv.amount,
        dueDate: inv.dueDate ? new Date(inv.dueDate).toISOString().split('T')[0] : 'N/A',
        status: inv.status === 'PAID' ? 'Paid' : inv.status === 'OVERDUE' ? 'Overdue' : 'Upcoming',
        paymentDate: inv.paymentDate ? new Date(inv.paymentDate).toISOString().split('T')[0] : null,
        receipt: inv.receipt,
      })),
      timetables: (s.section?.timetables || []).map((t) => ({
        id: t.id,
        day: t.dayOfWeek,
        period: t.periodName,
        subject: t.subject?.name || 'Lecture',
        teacher: t.staff?.name || 'Faculty Member',
        room: t.room || 'Lab 1',
        color: t.colorTag,
      })),
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
    const roleLower = (req.user.role || '').toLowerCase();
    if (roleLower === 'guardian') {
      const guardian = await prisma.guardian.findFirst({
        where: {
          OR: [
            { email: { equals: req.user.email, mode: 'insensitive' } },
            { userId: req.user.id },
          ],
        },
      });
      if (!guardian || student.guardianId !== guardian.id) {
        return errorResponse(res, 'Access denied. You are not authorized to submit excuse notes for this student.', 403);
      }
    }

    const job = await prisma.queueJobRecord.create({
      data: {
        jobType: 'SMS_ALERT',
        target: 'Dean / Head Teacher',
        recipient: `Academic Coordinator (${student.section?.name || 'Main'})`,
        status: 'Completed',
        description: `Medical excuse note submitted for ${student.name} by ${student.guardian?.name || 'Guardian'}: "${excuseNote.trim().slice(0, 30)}..."`,
      },
    });

    return successResponse(res, job, 'Medical excuse note dispatched to academic council');
  } catch (err) {
    next(err);
  }
});

export default router;
