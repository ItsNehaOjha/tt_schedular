import express from 'express'
import { body } from 'express-validator'
import {
  getTimetables,
  getTimetableByBranchSection,
  viewTimetable,
  getTeacherTimetable,
  getTimetableByClass,
  createTimetable,
  updateTimetable,
  publishTimetable,
  deleteTimetable,
  getTimetableStats,
  getBusyTeachersForSlot
} from '../controllers/timetableController.js'
// import { protect, authorize } from '../middleware/authMiddleware.js'

const router = express.Router()

// Validation rules
const timetableValidation = [
  body('year')
    .isIn(['1st Year', '2nd Year', '3rd Year', '4th Year'])
    .withMessage('Invalid year'),
  body('branch')
  .customSanitizer(value => value.toUpperCase().trim())
  .isIn(['CSE', 'CS', 'IT', 'EC', 'EE', 'ME', 'CE', 'MCA', 'MBA'])
  .withMessage('Invalid branch'),
 body('section')
  .customSanitizer(value => value.toUpperCase().trim())
  .isIn(['A', 'B', 'C', 'D'])
  .withMessage('Invalid section'),
  body('semester')
    .isInt({ min: 1, max: 8 })
    .withMessage('Semester must be between 1 and 8'),
  body('academicYear')
    .notEmpty()
    .withMessage('Academic year is required')
]

// ---------- PUBLIC ROUTES ----------
router.get('/view', viewTimetable)
router.get('/clash', getBusyTeachersForSlot) // day/slot busy teachers helper (kept public)
router.get('/teacher/:id', getTeacherTimetable) // <-- must be BEFORE "/:branch/:section"
router.get('/:branch/:section', getTimetableByBranchSection)

// ---------- PROTECTED (COORDINATOR) ROUTES ----------
router.get('/stats',  getTimetableStats)
router.get('/class',  getTimetableByClass)

// from here on: require auth


// optionally keep a protected variant for teachers/coordinators
router.get('/teacher/:id/timetable', getTeacherTimetable)

// coordinator-only CRUD
router.get('/',  getTimetables)
router.post('/',  timetableValidation, createTimetable)
router.put('/:id',  updateTimetable)
router.put('/:id/publish',  publishTimetable)
router.delete('/:id',  deleteTimetable) 

export default router
