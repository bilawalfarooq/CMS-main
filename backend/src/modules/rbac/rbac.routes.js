import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import { successResponse } from '../../utils/apiResponse.js';
import { DEFAULT_RBAC_MATRIX } from '../../config/constants.js';

const router = Router();
router.use(authenticate);

// In-memory or persisted policy matrix cache
let currentRbacMatrix = JSON.parse(JSON.stringify(DEFAULT_RBAC_MATRIX));

router.get('/matrix', authorize(['super_admin', 'principal']), (req, res) => {
  return successResponse(res, currentRbacMatrix, 'RBAC Matrix retrieved', 200);
});

router.put('/matrix', authorize(['super_admin']), (req, res) => {
  if (Array.isArray(req.body.matrix)) {
    currentRbacMatrix = req.body.matrix;
  }
  return successResponse(res, currentRbacMatrix, 'RBAC policy matrix updated successfully', 200);
});

router.post('/matrix/reset', authorize(['super_admin']), (req, res) => {
  currentRbacMatrix = JSON.parse(JSON.stringify(DEFAULT_RBAC_MATRIX));
  return successResponse(res, currentRbacMatrix, 'RBAC policy matrix restored to institutional defaults', 200);
});

export default router;
