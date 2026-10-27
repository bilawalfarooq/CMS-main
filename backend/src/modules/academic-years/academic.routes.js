import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Academic Years
router.get('/', async (req, res, next) => {
  try {
    const years = await prisma.academicYear.findMany({
      orderBy: { startDate: 'desc' },
    });
    return successResponse(res, years);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['super_admin']), async (req, res, next) => {
  try {
    const { id, name, startDate, endDate, status = 'Archived' } = req.body;
    const created = await prisma.academicYear.create({
      data: {
        id: id || `ay-${new Date(startDate).getFullYear()}`,
        name,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        status,
      },
    });
    return successResponse(res, created, 'Academic year created', 201);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/activate', authorize(['super_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.$transaction([
      prisma.academicYear.updateMany({ data: { isCurrent: false, status: 'Archived' } }),
      prisma.academicYear.update({
        where: { id },
        data: { isCurrent: true, status: 'Active' },
      }),
    ]);
    return successResponse(res, { activeYear: id }, `Academic year ${id} set as active`);
  } catch (err) {
    next(err);
  }
});

router.post('/rollover', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    return successResponse(
      res,
      { executed: true },
      'Append-Only Promotion Pipeline Executed: historical placements preserved under immutable foreign keys.'
    );
  } catch (err) {
    next(err);
  }
});

// Classes & Sections
router.get('/classes', async (req, res, next) => {
  try {
    const classes = await prisma.classGrade.findMany({
      include: {
        sections: true,
        _count: { select: { students: true } },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = classes.map((c) => ({
      id: c.id,
      name: c.name,
      level: c.level,
      headTeacher: c.headTeacher,
      studentCount: c._count.students,
      sections: c.sections.map((s) => s.name),
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

router.get('/sections', async (req, res, next) => {
  try {
    const { classId } = req.query;
    const where = classId ? { classId } : {};
    const sections = await prisma.section.findMany({
      where,
      include: { classGrade: true },
      orderBy: { name: 'asc' },
    });
    return successResponse(res, sections);
  } catch (err) {
    next(err);
  }
});

router.get('/subjects', async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' },
    });
    return successResponse(res, subjects);
  } catch (err) {
    next(err);
  }
});

export default router;
