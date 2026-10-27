import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

router.get('/', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const { action, search } = req.query;
    const where = {};

    if (action && action !== 'All') {
      where.action = action;
    }

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { actor: { contains: q, mode: 'insensitive' } },
        { entity: { contains: q, mode: 'insensitive' } },
        { ipAddress: { contains: q, mode: 'insensitive' } },
      ];
    }

    const logs = await prisma.auditLog.findMany({
      where,
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    const formatted = logs.map((l) => ({
      id: l.id,
      timestamp: l.timestamp.toISOString().replace('T', ' ').slice(0, 19),
      actor: l.actor,
      action: l.action,
      entity: l.entity,
      ip: l.ipAddress,
      status: l.status,
    }));

    return successResponse(res, formatted);
  } catch (err) {
    next(err);
  }
});

router.get('/export', authorize(['super_admin']), async (req, res, next) => {
  try {
    const logs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    const headers = ['Timestamp', 'Actor', 'Action', 'Entity', 'IP Address', 'Status'];
    const rows = logs.map((l) => [
      `"${l.timestamp.toISOString().replace('T', ' ').slice(0, 19)}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.entity.replace(/"/g, '""')}"`,
      `"${l.ipAddress}"`,
      `"${l.status}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="educore_audit_trail_${new Date().toISOString().slice(0, 10)}.csv"`
    );
    return res.status(200).send(csvContent);
  } catch (err) {
    next(err);
  }
});

export default router;
