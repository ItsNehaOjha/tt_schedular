import express from 'express'
import {
  getClassOptions,
  getAllClasses,
  getClassById
} from '../controllers/classController.js'

const router = express.Router()

// Public routes
router.get('/options', getClassOptions)
router.get('/', getAllClasses)
router.get('/:id', getClassById)

export default router