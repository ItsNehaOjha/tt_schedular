import express from 'express'
import { body } from 'express-validator'
import {
  getTimetables,
  getTimetableByBranchSection,
  getTeacherTimetable,
  getTimetableByClass,
  viewTimetable,
  createTimetable,
  updateTimetable,
  publishTimetable,
  deleteTimetable,
  getTimetableStats
} from '../controllers/timetableController.js'
import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// Validation rules
const timetableValidation = [
  body('year')
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year'])
    .withMessage('Invalid year'),
  body('branch')
    .isIn(['cse', 'ece', 'eee', 'mech', 'civil', 'it'])
    .withMessage('Invalid branch'),
  body('section')
    .isIn(['A', 'B', 'C', 'D'])
    .withMessage('Invalid section'),
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
]

// Public routes
router.get('/view', viewTimetable)

// Protected routes - Stats route MUST come before parameterized routes
router.get('/stats', protect, authorize('coordinator'), getTimetableStats)

// Parameterized routes (these should come after specific routes)
router.get('/:branch/:section', getTimetableByBranchSection)
router.get('/teacher/:id', getTeacherTimetable)
router.get('/class', protect, authorize('coordinator'), getTimetableByClass)

// Protected routes
router.use(protect)

// Teacher routes
router.get('/teacher/:id/timetable', authorize('teacher', 'coordinator'), getTeacherTimetable)

// Coordinator only routes
router.get('/', authorize('coordinator'), getTimetables)
router.post('/', authorize('coordinator'), timetableValidation, createTimetable)
router.put('/:id', authorize('coordinator'), updateTimetable)
router.put('/:id/publish', authorize('coordinator'), publishTimetable)
router.delete('/:id', authorize('coordinator'), deleteTimetable)

export default router