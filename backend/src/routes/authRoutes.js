import express from 'express'
import { body } from 'express-validator'
import {
  register,
  registerCoordinator,
  login,
  getMe,
  logout,
  updateDetails,
  updatePassword
} from '../controllers/authController.js'
import { protect } from '../middleware/authMiddleware.js'

const router = express.Router()

// Validation rules
const coordinatorRegisterValidation = [
  body('coordinatorId')
    .isLength({ min: 3, max: 50 })
    .withMessage('Coordinator ID must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9._@-]+$/)
    .withMessage('Coordinator ID can only contain letters, numbers, dots, underscores, @ and hyphens'),
  body('cname')
    .isLength({ min: 2, max: 100 })
    .withMessage('Coordinator name must be between 2 and 100 characters')
    .trim(),
  body('branch')
    .isIn(['cse', 'ece', 'eee', 'mech', 'civil', 'it'])
    .withMessage('Please select a valid branch'),
  body('year')
    .isIn(['1', '2', '3', '4'])
    .withMessage('Please select a valid year'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long')
]

const registerValidation = [
  body('username')
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .isIn(['teacher', 'coordinator'])
    .withMessage('Role must be either teacher or coordinator')
]

const updateDetailsValidation = [
  body('username')
    .optional()
    .isLength({ min: 3, max: 50 })
    .withMessage('Username must be between 3 and 50 characters'),
  body('firstName')
    .optional()
    .trim(),
  body('lastName')
    .optional()
    .trim(),
  body('department')
    .optional()
    .trim()
]

// Routes
router.post('/register', registerValidation, register)
router.post('/register-coordinator', coordinatorRegisterValidation, registerCoordinator)
router.post('/login', login)
router.get('/me', protect, getMe)
router.post('/logout', logout)
router.put('/updatedetails', protect, updateDetailsValidation, updateDetails)
router.put('/updatepassword', protect, updatePassword)

export default router