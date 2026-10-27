import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import prisma from '../../config/prisma.js';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

router.get('/summary', async (req, res, next) => {
  try {
    const [totalStudents, activeStudents, staffCount, invoices, anomalies] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({ where: { status: 'ACTIVE' } }),
      prisma.staff.count({ where: { status: 'Active' } }),
      prisma.invoice.findMany(),
      prisma.student.findMany({
        where: { anomalyAlert: { not: null } },
        select: { id: true, name: true, classGrade: { select: { name: true } }, anomalyAlert: true },
        take: 5,
      }),
    ]);

    const totalBilled = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const totalCollected = invoices
      .filter((inv) => inv.status === 'PAID')
      .reduce((sum, inv) => sum + inv.amount, 0);
    const totalOutstanding = totalBilled - totalCollected;
    const collectionRate = totalBilled > 0 ? Number(((totalCollected / totalBilled) * 100).toFixed(1)) : 0;

    return successResponse(res, {
      totalEnrolled: totalStudents,
      activeEnrolled: activeStudents,
      totalStaff: staffCount,
      feeCollection: {
        totalBilled,
        totalCollected,
        totalOutstanding,
        collectionRate,
        activeWaivers: 8,
      },
      anomalies: anomalies.map((a) => ({
        id: a.id,
        name: a.name,
        grade: a.classGrade?.name,
        alert: a.anomalyAlert,
      })),
    });
  } catch (err) {
    next(err);
  }
});

router.get('/activities', async (req, res, next) => {
  try {
    const [recentLogs, queueActivities] = await Promise.all([
      prisma.auditLog.findMany({
        take: 6,
        orderBy: { timestamp: 'desc' },
      }),
      prisma.queueJobRecord.findMany({
        take: 6,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return successResponse(res, {
      recentLogs,
      queueActivities,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
