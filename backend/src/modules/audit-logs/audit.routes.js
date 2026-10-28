import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

function formatKarachiTimestamp(date) {
  try {
    const d = new Date(date);
    if (isNaN(d.getTime())) return String(date);
    const formatted = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Karachi',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(d);
    return formatted.replace(',', '') + ' (PKT)';
  } catch (err) {
    return date.toISOString().replace('T', ' ').slice(0, 19);
  }
}

function normalizeDisplayIp(ip) {
  if (!ip || ip === '::1' || ip === '::ffff:127.0.0.1' || ip === '127.0.0.1') {
    return '127.0.0.1 (Localhost / Karachi Dev)';
  }
  return ip.replace(/^::ffff:/, '');
}

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
      timestamp: formatKarachiTimestamp(l.timestamp),
      isoTimestamp: l.timestamp.toISOString(),
      actor: l.actor,
      action: l.action,
      entity: l.entity,
      ip: normalizeDisplayIp(l.ipAddress),
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

    const headers = ['Timestamp (PKT)', 'Actor', 'Action', 'Entity', 'IP Address', 'Status'];
    const rows = logs.map((l) => [
      `"${formatKarachiTimestamp(l.timestamp)}"`,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.entity.replace(/"/g, '""')}"`,
      `"${normalizeDisplayIp(l.ipAddress)}"`,
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
