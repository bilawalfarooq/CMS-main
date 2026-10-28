import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';
import * as classService from './class.service.js';
import { successResponse, errorResponse } from '../../utils/apiResponse.js';

const router = Router();
router.use(authenticate);

// List classes
router.get('/', async (req, res, next) => {
  try {
    const { search, program, department, status, page, limit } = req.query;
    const result = await classService.listClasses({
      search,
      program,
      department,
      status,
      page,
      limit,
    });
    return successResponse(res, result);
  } catch (err) {
    next(err);
  }
});

// Create class (Super Admin & Principal)
router.post('/', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const actor = req.user?.name || 'Administrator';
    const created = await classService.createClass(req.body, actor);
    return successResponse(res, created, 'Class created successfully', 201);
  } catch (err) {
    const status = err.message.includes('already exists') || err.message.includes('already taken') ? 409 : 400;
    return errorResponse(res, err.message, status);
  }
});

// Complete class profile & 7 tabs data
router.get('/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const profile = await classService.getClassProfile(id);
    return successResponse(res, profile);
  } catch (err) {
    return errorResponse(res, err.message, 404);
  }
});

// Update class
router.patch('/:id', authorize(['super_admin', 'principal']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user?.name || 'Administrator';
    const updated = await classService.updateClass(id, req.body, actor);
    return successResponse(res, updated, 'Class updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

// Delete or archive class
router.delete('/:id', authorize(['super_admin']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const { force } = req.query;
    const actor = req.user?.name || 'Super Admin';
    const result = await classService.deleteClass(id, force === 'true', actor);
    return successResponse(res, result, result.message);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

// Add section under class
router.post('/:id/sections', authorize(['super_admin', 'principal', 'admin_staff']), async (req, res, next) => {
  try {
    const { id } = req.params;
    const actor = req.user?.name || 'Administrator';
    const section = await classService.createSection(id, req.body, actor);
    return successResponse(res, section, 'Section created successfully', 201);
  } catch (err) {
    const status = err.message.includes('already exists') ? 409 : 400;
    return errorResponse(res, err.message, status);
  }
});

// Update section
router.patch('/sections/:sectionId', authorize(['super_admin', 'principal', 'admin_staff']), async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const actor = req.user?.name || 'Administrator';
    const section = await classService.updateSection(sectionId, req.body, actor);
    return successResponse(res, section, 'Section updated successfully');
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

// Delete or deactivate section
router.delete('/sections/:sectionId', authorize(['super_admin']), async (req, res, next) => {
  try {
    const { sectionId } = req.params;
    const { force } = req.query;
    const actor = req.user?.name || 'Super Admin';
    const result = await classService.deleteSection(sectionId, force === 'true', actor);
    return successResponse(res, result, result.message);
  } catch (err) {
    return errorResponse(res, err.message, 400);
  }
});

export default router;
