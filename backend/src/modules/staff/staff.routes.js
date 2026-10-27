import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import prisma from '../../config/prisma.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

router.get('/', async (req, res, next) => {
  try {
    const { search, department } = req.query;
    const where = {};

    if (search && search.trim()) {
      const q = search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { department: { contains: q, mode: 'insensitive' } },
        { id: { contains: q, mode: 'insensitive' } },
      ];
    }

    if (department && department !== 'All') {
      where.department = department;
    }

    const staff = await prisma.staff.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return successResponse(res, staff);
  } catch (err) {
    next(err);
  }
});

router.post('/', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const {
      name,
      department,
      role = 'Lecturer',
      contract = 'Full-Time',
      phone,
      teachingHours = 16,
      maxHours = 22,
      assignedClasses = ['Grade 10-B', 'Grade 11-A'],
    } = req.body;

    const email = req.body.email || `${name.toLowerCase().replace(/[^a-z0-9]/g, '.')}@educore.edu`;
    let id = req.body.id;
    if (!id) {
      const allStaff = await prisma.staff.findMany({ select: { id: true } });
      let maxNum = 50;
      for (const s of allStaff) {
        const match = (s.id || '').match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) maxNum = num;
        }
      }
      id = `STF-${String(maxNum + 1).padStart(3, '0')}`;
    }

    const created = await prisma.staff.create({
      data: {
        id,
        name,
        email,
        department,
        role,
        contract,
        phone: phone || '+1 (555) 782-9900',
        teachingHours: Number(teachingHours),
        maxHours: Number(maxHours),
        assignedClasses,
        status: 'Active',
      },
    });

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Dean Vance (Principal)',
        action: 'STAFF_APPOINTMENT',
        entity: `${created.name} appointed to ${created.department}`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(res, created, 'Faculty member registered successfully', 201);
  } catch (err) {
    next(err);
  }
});

router.delete('/:id', authorize(['super_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) return errorResponse(res, 'Staff member not found', 404);

    await prisma.staff.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        actor: req.user?.name || 'Super Admin',
        action: 'STAFF_RESIGNATION',
        entity: `Staff contract concluded for ${staff.name} (${id})`,
        ipAddress: '127.0.0.1',
        status: 'Success',
      },
    });

    return successResponse(res, null, 'Staff record concluded');
  } catch (err) {
    next(err);
  }
});

export default router;
