import { ACTIVE_SESSION } from '../utils/sessionConfig.js';
import { AppError } from '../utils/errorHandler.js';

export const oddEvenGuard = (req, res, next) => {
  const { semester, academicYear } = req.body;
  if (academicYear !== ACTIVE_SESSION.academicYear) {
    return next(new AppError(`Academic year locked to ${ACTIVE_SESSION.academicYear}`, 400));
  }
  const isOdd = Number(semester) % 2 === 1;
  if (ACTIVE_SESSION.semesterType === 'ODD' && !isOdd) {
    return next(new AppError('Even semesters are disabled for current session', 400));
  }
  if (ACTIVE_SESSION.semesterType === 'EVEN' && isOdd) {
    return next(new AppError('Odd semesters are disabled for current session', 400));
  }
  return next();
};
