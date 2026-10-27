import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { MAX_FILE_SIZE_BYTES } from '../../config/constants.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { studentId, category, search } = req.query;

    const where = {};
    if (studentId) where.studentId = studentId;
    if (category && category !== 'All') where.category = category.toUpperCase();
    if (search && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { student: { name: { contains: search.trim(), mode: 'insensitive' } } },
      ];
    }

    const docs = await prisma.studentDocument.findMany({
      where,
      include: {
        student: { select: { id: true, name: true } },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    const formatted = docs.map((d) => ({
      id: d.id,
      studentId: d.studentId,
      studentName: d.student.name,
      title: d.title,
      category: d.category.charAt(0) + d.category.slice(1).toLowerCase(),
      size: d.size,
      mimeType: d.mimeType,
      uploadedAt: d.uploadedAt.toISOString().slice(0, 10),
      status: d.status,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['super_admin', 'admin_staff', 'principal']), async (req, res, next) => {
  try {
    const {
      title,
      category = 'Identity',
      studentName,
      studentId,
      sizeBytes = 1024 * 500, // 500 KB default
      mimeType = 'application/pdf',
    } = req.body;

    // Strict 2MB ceiling enforcement
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return errorResponse(
        res,
        `File rejected: Size (${(sizeBytes / (1024 * 1024)).toFixed(2)} MB) exceeds the architectural 2.0 MB maximum ceiling (Limitation 7.4).`,
        413
      );
    }

    // Resolve student
    let targetStudent = null;
    if (studentId) {
      targetStudent = await prisma.student.findUnique({ where: { id: studentId } });
    } else if (studentName) {
      targetStudent = await prisma.student.findFirst({ where: { name: studentName } });
    }

    if (!targetStudent) {
      targetStudent = await prisma.student.findFirst();
    }

    const sizeFormatted = `${Math.round(sizeBytes / 1024)} KB`;

    const created = await prisma.studentDocument.create({
      data: {
        id: `doc-${Date.now()}`,
        studentId: targetStudent ? targetStudent.id : 'STU-2026-0101',
        title,
        category: category.toUpperCase(),
        size: sizeFormatted,
        mimeType,
        storagePath: `vault/${targetStudent?.id || 'general'}/${title}`,
        status: 'Verified',
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Registrar Admissions Staff',
        action: 'DOCUMENT_UPLOAD',
        entity: `Vault ingested ${title} for ${targetStudent?.name || 'Student'}`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(res, created, 'Document uploaded successfully', 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize(['super_admin', 'admin_staff']), async (req, res, next) => {
  try {
    const { id } = req.params;
    await prisma.studentDocument.delete({ where: { id } });
    return successResponse(res, null, 'Document removed from vault');
  } catch (err) {
    next(err);
  }
});

export default router;
