// backend/src/routes/coordinatorRoutes.js
import express from 'express';
import { body } from 'express-validator';
import { protect, authorize } from '../middleware/authMiddleware.js';
import {
  createTeacher,
  getTeachers
} from '../controllers/coordinatorController.js';

const router = express.Router();

// Only coordinators
router.use(protect);
router.use(authorize('coordinator'));

/**
 * GET /api/coordinator/teachers
 * Legacy list (kept for compatibility). Prefer /api/teachers/list.
 */
router.get('/teachers', getTeachers);

/**
 * POST /api/coordinator/create-teacher
 * Minimal fields; no username/password for teacher.
 */
router.post(
  '/create-teacher',
  [
    body('firstName').isString().trim().notEmpty().withMessage('firstName is required'),
    body('lastName').optional().isString().trim(),
    body('department').optional().isString().trim(),
   
  ],
  createTeacher
);

export default router;
