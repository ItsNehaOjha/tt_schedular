// backend/src/controllers/timetableController.js
// Facade aggregator for modular timetable controllers

export { generateSampleTimetable } from './timetable/generateController.js';
export { getDraftTimetable } from './timetable/draftController.js';
export {
  getTimetables,
  createTimetable,
  updateTimetable,
  deleteTimetable
} from './timetable/crudController.js';
export {
  getTimetableByBranchSection,
  viewTimetable,
  getTimetableByClass
} from './timetable/viewController.js';
export { getTeacherTimetable } from './timetable/teacherController.js';
export { getBusyTeachersForSlot } from './timetable/busyTeacherController.js';
export { publishTimetable } from './timetable/publishController.js';
export { getTimetableStats } from './timetable/statsController.js';