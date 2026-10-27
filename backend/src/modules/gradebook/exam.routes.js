import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const exams = await prisma.examSchedule.findMany({
      include: { classGrade: true },
      orderBy: { date: 'asc' },
    });

    const formatted = exams.map((e) => ({
      id: e.id,
      title: e.title,
      classLevel: e.classGrade.name,
      date: e.date.toISOString().slice(0, 10),
      time: e.timeSlot,
      hall: e.hall,
      capacity: e.capacity,
      enrolled: e.enrolled,
      invigilator: e.invigilator,
      status: e.status,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const {
      title,
      classLevel = 'Grade 10',
      date,
      time = '09:00 AM - 11:30 AM',
      hall = 'Auditorium Hall A',
      capacity = 120,
      enrolled = 88,
      invigilator = 'Dr. Evelyn Reed',
    } = req.body;

    const classGrade = await prisma.classGrade.findUnique({
      where: { name: classLevel },
    });
    if (!classGrade) return errorResponse(res, `Class '${classLevel}' not found`, 404);

    const created = await prisma.examSchedule.create({
      data: {
        id: `ex-${Date.now()}`,
        title,
        classId: classGrade.id,
        date: new Date(date),
        timeSlot: time,
        hall,
        capacity: Number(capacity),
        enrolled: Number(enrolled),
        invigilator,
        status: 'Scheduled',
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Dean Vance (Principal)',
        action: 'EXAM_SESSION_SCHEDULED',
        entity: `Session scheduled: ${title} (${classLevel}) in ${hall}`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(res, created, 'Examination session scheduled', 201);
  } catch (err) {
    next(err);
  }
});

export default router;
