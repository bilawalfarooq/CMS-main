import { Router } from 'express';
import * as studentController from './student.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import {
  listStudentsSchema,
  createStudentSchema,
  updateStudentSchema,
  updateStatusSchema,
  batchPromotionSchema,
} from './student.schema.js';

const router = Router();
router.use(authenticate);

router.get('/', validateRequest(listStudentsSchema), studentController.listStudents);
router.get('/export', studentController.exportCSV);
router.get('/:id', studentController.getStudent);
router.post(
  '/',
  authorize(['super_admin', 'admin_staff']),
  validateRequest(createStudentSchema),
  studentController.createAdmission
);
router.post(
  '/bulk-import',
  authorize(['super_admin', 'admin_staff']),
  studentController.bulkImport
);
router.patch(
  '/:id',
  authorize(['super_admin', 'admin_staff']),
  validateRequest(updateStudentSchema),
  studentController.updateProfile
);
router.patch(
  '/:id/status',
  authorize(['super_admin', 'admin_staff', 'principal']),
  validateRequest(updateStatusSchema),
  studentController.updateStatus
);
router.delete('/:id', authorize(['super_admin']), studentController.deleteStudent);
router.post(
  '/promotion/execute',
  authorize(['super_admin', 'principal']),
  validateRequest(batchPromotionSchema),
  studentController.promote
);

export default router;
