import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import prisma from '../../config/prisma.js';
import { successResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// Get Notifications
router.get('/', async (req, res, next) => {
  try {
    const notifications = await prisma.notificationLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
    return successResponse(res, notifications);
  } catch (err) {
    next(err);
  }
});

router.patch('/:id/read', async (req, res, next) => {
  try {
    const { id } = req.params;
    const updated = await prisma.notificationLog.update({
      where: { id },
      data: { unread: false },
    });
    return successResponse(res, updated);
  } catch (err) {
    next(err);
  }
});

router.post('/mark-all-read', async (req, res, next) => {
  try {
    await prisma.notificationLog.updateMany({
      where: { unread: true },
      data: { unread: false },
    });
    return successResponse(res, null, 'All notifications marked as read');
  } catch (err) {
    next(err);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    await prisma.notificationLog.deleteMany();
    return successResponse(res, null, 'Notification drawer cleared');
  } catch (err) {
    next(err);
  }
});

// Queue telemetry
router.get('/queue-jobs', async (req, res, next) => {
  try {
    const jobs = await prisma.queueJobRecord.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
    return successResponse(res, jobs);
  } catch (err) {
    next(err);
  }
});

router.post('/queue-jobs', async (req, res, next) => {
  try {
    const { type, target, recipient, status = 'Completed', description } = req.body;
    const created = await prisma.queueJobRecord.create({
      data: {
        jobType: type,
        target,
        recipient,
        status,
        description,
      },
    });
    return successResponse(res, created, 'Job enqueued', 201);
  } catch (err) {
    next(err);
  }
});

export default router;
