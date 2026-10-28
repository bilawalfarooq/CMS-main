import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';
import * as timetableService from './timetable.service.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { section, day } = req.query;

    const where = {};
    if (section && section !== 'All') {
      where.section = { name: section };
    }
    if (day && day !== 'All') {
      where.dayOfWeek = day;
    }

    const slots = await prisma.timetableSlot.findMany({
      where,
      include: {
        subject: true,
        staff: true,
        section: true,
      },
      orderBy: { periodName: 'asc' },
    });

    // Group by section and day matching frontend expectation
    const schedule = {};
    for (const slot of slots) {
      const secName = slot.section.name;
      const dayName = slot.dayOfWeek;
      if (!schedule[secName]) schedule[secName] = {};
      if (!schedule[secName][dayName]) schedule[secName][dayName] = [];

      schedule[secName][dayName].push({
        id: slot.id,
        period: slot.periodName,
        subject: slot.subject.name,
        teacher: slot.staff.name,
        room: slot.room,
        color: slot.colorTag || 'bg-indigo-50 text-indigo-700 border-indigo-200',
      });
    }

    return successResponse(res, schedule);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const {
      academicYearId = 'ay-2026',
      sectionName,
      dayOfWeek,
      periodName,
      subjectName,
      staffName,
      room,
      colorTag,
    } = req.body;

    // Check collision on room
    const roomCollision = await prisma.timetableSlot.findFirst({
      where: { dayOfWeek, periodName, room },
      include: { staff: true, section: true },
    });
    if (roomCollision) {
      return errorResponse(
        res,
        `Room conflict: ${room} is already allocated to ${roomCollision.section.name} on ${dayOfWeek} (${periodName})`,
        409
      );
    }

    // Check collision on teacher
    const staff = await prisma.staff.findFirst({ where: { name: staffName } });
    if (staff) {
      const teacherCollision = await prisma.timetableSlot.findFirst({
        where: { dayOfWeek, periodName, staffId: staff.id },
        include: { section: true },
      });
      if (teacherCollision) {
        return errorResponse(
          res,
          `Teacher conflict: ${staffName} is already assigned to ${teacherCollision.section.name} on ${dayOfWeek} (${periodName})`,
          409
        );
      }
    }

    // Resolve section & subject
    const section = await prisma.section.findFirst({ where: { name: sectionName } });
    const subject = await prisma.subject.findFirst({ where: { name: subjectName } });

    if (!section || !subject || !staff) {
      return errorResponse(res, 'Section, Subject, or Staff member not found', 400);
    }

    const created = await prisma.timetableSlot.create({
      data: {
        academicYearId,
        sectionId: section.id,
        dayOfWeek,
        periodName,
        subjectId: subject.id,
        staffId: staff.id,
        room,
        colorTag,
      },
    });

    return successResponse(res, created, 'Timetable slot created successfully', 201);
  } catch (err) {
    next(err);
  }
});

// Automatic Timetable Generation Engine
router.post('/generate', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const result = await timetableService.generateAutomatedTimetable(req.body);
    return successResponse(res, result, 'Automated timetable generation completed');
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

// Timetable Conflict Validator
router.post('/validate', authorize(['super_admin', 'principal', 'teacher']), async (req, res, next) => {
  try {
    const result = await timetableService.validateTimetableSlots(req.body);
    return successResponse(res, result);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

// Publish Timetable Draft to Production
router.post('/publish', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const actor = req.user?.name || 'Administrator';
    const result = await timetableService.publishTimetable({ ...req.body, actor });
    return successResponse(res, result, 'Timetable published successfully');
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

// Get Timetable Configuration for a Class / Section
router.get('/configs', async (req, res, next) => {
  try {
    const { classId, sectionId, academicYearId = 'ay-2026' } = req.query;
    const where = { academicYearId };
    if (classId) where.classId = classId;
    if (sectionId) where.sectionId = sectionId;

    const configs = await prisma.timetableConfig.findMany({
      where,
      include: { classGrade: true, section: true },
      orderBy: { createdAt: 'desc' },
    });

    return successResponse(res, configs);
  } catch (err) {
    next(err);
  }
});

export default router;
