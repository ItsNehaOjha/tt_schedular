import express from 'express'
import { body } from 'express-validator'
import {
  getTeachers,
  createTeacher,
  updateTeacher,
  deleteTeacher,
  initializePredefinedTeachers
} from '../controllers/coordinatorController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// Protect all routes and authorize only coordinators
router.use(protect)
router.use(authorize('coordinator'))

// Teacher management routes
router.route('/teachers')
  .get(getTeachers)

router.route('/create-teacher')
  .post([
    body('username')
      .isLength({ min: 3, max: 50 })
      .withMessage('Username must be between 3 and 50 characters')
      .matches(/^[a-zA-Z0-9._-]+$/)
      .withMessage('Username can only contain letters, numbers, dots, underscores, and hyphens'),
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    body('department')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Department must be less than 100 characters'),
    body('password')
      .optional()
      .isLength({ min: 6 })
      .withMessage('Password must be at least 6 characters long')
  ], createTeacher)

router.route('/teachers/:id')
  .put([
    body('firstName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('First name must be less than 50 characters'),
    body('lastName')
      .optional()
      .trim()
      .isLength({ max: 50 })
      .withMessage('Last name must be less than 50 characters'),
    body('department')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Department must be less than 100 characters')
  ], updateTeacher)
  .delete(deleteTeacher)

router.route('/teachers/initialize')
  .post(initializePredefinedTeachers)

export default router