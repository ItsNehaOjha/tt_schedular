// backend/src/routes/teacherRoutes.js
import express from 'express';

import {
  listTeachers,
  listTeachersGrouped,
  getTeacherById,
  updateTeacher,
  deleteTeacher
} from '../controllers/teacherController.js';

const router = express.Router();


// Searchable teacher list for dropdowns
router.get('/list', listTeachers);

// Grouped by department (useful for sidebar/grouped UI)
router.get('/grouped', listTeachersGrouped);

// Read/update/delete a teacher
router.get('/:id', getTeacherById);
router.patch('/:id', updateTeacher);
router.delete('/:id', deleteTeacher);

export default router;
