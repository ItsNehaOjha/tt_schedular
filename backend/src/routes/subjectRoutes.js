import express from 'express';
import {
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  initializePredefinedSubjects
} from '../controllers/subjectController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getSubjects);
// Fallback-style route to support /api/subject/branch/:branch/semester/:semester
router.get('/branch/:branch/semester/:semester', getSubjects);

// Coordinator-only routes
router.post('/', protect, authorize('coordinator'), createSubject);
router.put('/:id', protect, authorize('coordinator'), updateSubject);
router.delete('/:id', protect, authorize('coordinator'), deleteSubject);
router.post('/initialize', protect, authorize('coordinator'), initializePredefinedSubjects);

export default router;