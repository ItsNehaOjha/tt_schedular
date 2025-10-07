import express from 'express'
import { body } from 'express-validator'
import {
  getNotifications,
  createNotification,
  markAsRead,
  deleteNotification
} from '../controllers/notificationController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// Validation rules
const notificationValidation = [
  body('title')
    .notEmpty()
    .withMessage('Notification title is required')
    .isLength({ max: 200 })
    .withMessage('Title cannot exceed 200 characters'),
  body('message')
    .notEmpty()
    .withMessage('Notification message is required')
    .isLength({ max: 1000 })
    .withMessage('Message cannot exceed 1000 characters'),
  body('type')
    .optional()
    .isIn(['timetable_published', 'timetable_updated', 'system', 'announcement'])
    .withMessage('Invalid notification type'),
  body('targetAudience')
    .optional()
    .isIn(['all', 'students', 'teachers', 'coordinators'])
    .withMessage('Invalid target audience'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Invalid priority level')
]

// Public routes
router.get('/', getNotifications)
router.put('/:id/read', markAsRead)

// Protected routes (Coordinator only)
router.use(protect)
router.use(authorize('coordinator'))

router.post('/', notificationValidation, createNotification)
router.delete('/:id', deleteNotification)

export default router