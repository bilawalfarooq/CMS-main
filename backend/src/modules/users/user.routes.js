import { Router } from 'express';
import * as userController from './user.controller.js';
import { validateRequest } from '../../middleware/validateRequest.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { listUsersSchema, createUserSchema } from './user.schema.js';

const router = Router();

router.use(authenticate);

router.get('/', authorize(['super_admin', 'principal']), validateRequest(listUsersSchema), userController.listUsers);
router.post('/', authorize(['super_admin']), validateRequest(createUserSchema), userController.createUser);
router.patch('/:id/status', authorize(['super_admin']), userController.toggleStatus);
router.post('/:id/send-reset', authorize(['super_admin']), userController.sendReset);

export default router;
