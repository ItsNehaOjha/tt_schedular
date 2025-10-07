import express from 'express';
import { getAllTeachers, getTeacherById } from '../controllers/teacherController.js';

const router = express.Router();

// Public routes
router.get('/all', getAllTeachers);
router.get('/:id', getTeacherById);

export default router;