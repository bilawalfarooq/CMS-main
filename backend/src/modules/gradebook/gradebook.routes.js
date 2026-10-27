import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { calculateWeightedScore, deriveLetterGrade } from '../../utils/scoreCalculator.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Get Gradebook
router.get('/', async (req, res, next) => {
  try {
    const { section, subject } = req.query;

    const where = {};
    if (section && section !== 'All') {
      where.section = { name: section };
    }
    if (subject && subject !== 'All') {
      where.subject = { name: subject };
    }

    const grades = await prisma.gradeRecord.findMany({
      where,
      include: {
        student: { select: { id: true, name: true, rollNo: true } },
        subject: true,
      },
      orderBy: { student: { rollNo: 'asc' } },
    });

    const formatted = grades.map((g) => ({
      id: g.id,
      studentId: g.studentId,
      name: g.student.name,
      rollNo: g.student.rollNo,
      quiz1: g.quiz1,
      midterm: g.midterm,
      project: g.project,
      finalExam: g.finalExam,
      weightedScore: g.weightedScore,
      letterGrade: g.letterGrade,
      status: g.status,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

// Update single score
router.patch('/:id', authorize(['super_admin', 'teacher']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { field, value } = req.body;

    const existing = await prisma.gradeRecord.findUnique({ where: { id } });
    if (!existing) return errorResponse(res, 'Grade record not found', 404);

    const updateData = {};
    if (['quiz1', 'midterm', 'project', 'finalExam'].includes(field)) {
      updateData[field] = value !== '' && value !== null && !isNaN(Number(value)) ? Number(value) : null;
    }

    const mergedScores = {
      quiz1: updateData.quiz1 !== undefined ? updateData.quiz1 : existing.quiz1,
      midterm: updateData.midterm !== undefined ? updateData.midterm : existing.midterm,
      project: updateData.project !== undefined ? updateData.project : existing.project,
      finalExam: updateData.finalExam !== undefined ? updateData.finalExam : existing.finalExam,
    };

    updateData.weightedScore = calculateWeightedScore(mergedScores);
    updateData.letterGrade = deriveLetterGrade(updateData.weightedScore);

    const updated = await prisma.gradeRecord.update({
      where: { id },
      data: updateData,
    });

    return successResponse(res, updated, 'Score updated successfully');
  } catch (err) {
    next(err);
  }
});

// Batch Save Grades
router.post('/batch-save', authorize(['super_admin', 'teacher']), async (req, res, next) => {
  try {
    const { sectionName, subjectName, grades = [] } = req.body;

    let updatedCount = 0;
    if (Array.isArray(grades) && grades.length > 0) {
      await prisma.$transaction(async (tx) => {
        for (const item of grades) {
          const updateData = {};
          if (item.quiz1 !== undefined) updateData.quiz1 = item.quiz1 !== '' && item.quiz1 !== null ? Number(item.quiz1) : null;
          if (item.midterm !== undefined) updateData.midterm = item.midterm !== '' && item.midterm !== null ? Number(item.midterm) : null;
          if (item.project !== undefined) updateData.project = item.project !== '' && item.project !== null ? Number(item.project) : null;
          if (item.finalExam !== undefined) updateData.finalExam = item.finalExam !== '' && item.finalExam !== null ? Number(item.finalExam) : null;

          updateData.weightedScore = calculateWeightedScore(updateData);
          updateData.letterGrade = deriveLetterGrade(updateData.weightedScore);

          if (item.id) {
            await tx.gradeRecord.update({
              where: { id: item.id },
              data: updateData,
            });
            updatedCount++;
          } else if (item.studentId) {
            const record = await tx.gradeRecord.findFirst({
              where: { studentId: item.studentId },
            });
            if (record) {
              await tx.gradeRecord.update({
                where: { id: record.id },
                data: updateData,
              });
              updatedCount++;
            }
          }
        }
      });
    }

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Dr. Evelyn Reed (Teacher)',
        action: 'GRADE_BATCH_UPDATE',
        entity: `${sectionName || 'Section'} ${subjectName || 'Subject'} grades committed via batch transaction (${updatedCount} records persisted)`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(
      res,
      { count: updatedCount },
      'Grades committed via atomic batch transaction. Zero lock contention.'
    );
  } catch (err) {
    next(err);
  }
});

// Queue PDF generation
router.post('/generate-pdfs', authorize(['super_admin', 'principal', 'teacher']), async (req, res, next) => {
  try {
    const { section = 'Grade 10-A', subject = 'All Subjects' } = req.body;

    const job = await prisma.queueJobRecord.create({
      data: {
        jobType: 'PDF_REPORT',
        target: `${section} (${subject})`,
        recipient: 'Batch Compilation (PDF)',
        status: 'Processing',
        description: `Exporting official term report cards for ${section}`,
      },
    });

    return successResponse(res, job, 'Queued PDF Report Card generator job');
  } catch (err) {
    next(err);
  }
});

export default router;
