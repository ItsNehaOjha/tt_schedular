import Timetable from '../../models/Timetable.js'
import { asyncHandler } from '../../utils/errorHandler.js'

// Fetch a draft timetable by id
export const getDraftTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const draft = await Timetable.findById(id).lean();
  if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });

  const days = (draft.metadata && Array.isArray(draft.metadata.weekDays) && draft.metadata.weekDays.length)
    ? draft.metadata.weekDays
    : [...new Set((draft.schedule || []).map(s => s.day))].filter(Boolean);
  const timeSlots = (draft.metadata && Array.isArray(draft.metadata.timeSlots) && draft.metadata.timeSlots.length)
    ? draft.metadata.timeSlots
    : [...new Set((draft.schedule || []).map(s => s.timeSlot))].filter(Boolean);
  return res.json({ success: true, data: { ...draft, days, timeSlots } });
});
