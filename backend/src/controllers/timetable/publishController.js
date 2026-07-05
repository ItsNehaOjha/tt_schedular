import Timetable from '../../models/Timetable.js'
import { AppError, asyncHandler } from '../../utils/errorHandler.js'
import { createTimetableNotification } from '../notificationController.js'

export const publishTimetable = asyncHandler(async (req, res, next) => {
  const { year, branch, section, semester, academicYear, schedule, isPublished } = req.body;
  
  if (!year || !branch || !section || !semester || !academicYear)
    return next(new AppError('Missing class identifiers', 400));

  const filter = { 
    year, 
    branch: branch.toUpperCase(), 
    section: section.toUpperCase(), 
    semester, 
    academicYear 
  };

  const userId = req.user?._id || null;

  // Build full coordinator name
  const coordinatorName = req.body.coordinatorName?.trim() || (() => {
    if (req.user?.cname) {
      const name = req.user.cname.trim();
      if (/^(Mr|Ms|Mrs|Dr|Prof)\.?\s+/i.test(name)) {
        return name;
      }
      const salutation = req.user?.salutation ? `${req.user.salutation}.` : "Mr.";
      return `${salutation} ${name}`;
    }
    const salutation = req.user?.salutation ? `${req.user.salutation}.` : "Mr.";
    const first = req.user?.firstName?.trim() || "";
    const last = req.user?.lastName?.trim() || "";
    return [salutation, first, last].filter(Boolean).join(" ").trim();
  })();

  const timetable = await Timetable.findOne(filter);

  const baseSet = {
    schedule,
    isPublished: !!isPublished,
    publishedAt: isPublished ? new Date() : null,
    lastModifiedBy: userId,
    createdBy: userId,
    updatedAt: new Date(),
  };

  // Store coordinator name only when publishing
  if (isPublished) {
    baseSet.coordinatorName = coordinatorName;
  }

  const update = { $set: baseSet };

  if (timetable) {
    update.$set.publishedVersion = (timetable.publishedVersion || 1) + 1;
    update.$push = {
      revisionHistory: {
        version: update.$set.publishedVersion,
        updatedAt: new Date(),
        updatedBy: userId
      }
    };
  }

  // Update or create timetable
  const updated = await Timetable.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    runValidators: true
  }).populate('createdBy lastModifiedBy', 'username firstName lastName');

  // Notify subscribers
  if (isPublished && userId) {
    await createTimetableNotification(updated._id, 'timetable_published', userId);
  }

  res.status(200).json({
    success: true,
    message: `Timetable ${isPublished ? 'published' : 'unpublished'} successfully`,
    data: updated
  });
});
