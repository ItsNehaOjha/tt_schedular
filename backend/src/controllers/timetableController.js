// backend/controllers/timetableController.js
import { validationResult } from 'express-validator'
import Timetable from '../models/Timetable.js'
import User from '../models/User.js'
import Subject from '../models/Subject.js'
import { AppError, asyncHandler } from '../utils/errorHandler.js'
import { createTimetableNotification } from './notificationController.js'
import mongoose from 'mongoose';
import crypto from 'crypto';

// Helper function to check if a teacher is busy at a specific day and time slot
const isTeacherBusy = async (teacherId, day, timeSlot, excludeSection = null) => {
  if (!teacherId) return false;
  
  const query = {
    'schedule.day': day,
    'schedule.timeSlot': timeSlot,
    'schedule.teacher.id': teacherId
  };
  
  // Exclude the current section if provided
  if (excludeSection) {
    query.section = { $ne: excludeSection };
  }
  
  const count = await Timetable.countDocuments(query);
  return count > 0;
};


/* ============================================================
   🟢 GET ALL TIMETABLES (for Coordinators)
   Route: GET /api/timetable
   Access: Private (Coordinator)
============================================================ */
export const getTimetables = asyncHandler(async (req, res, next) => {
  const { page = 1, limit = 10, year, branch, section, isPublished } = req.query

  const query = {}
  if (year) query.year = year
  if (branch) query.branch = branch
  if (section) query.section = section
  if (isPublished !== undefined) query.isPublished = isPublished === 'true'

  const sortOrder = { isPublished: -1, updatedAt: -1, createdAt: -1 }

  const timetables = await Timetable.find(query)
    .populate('createdBy', 'username firstName lastName')
    .populate('lastModifiedBy', 'username firstName lastName')
    .sort(sortOrder)
    .limit(Number(limit))
    .skip((Number(page) - 1) * Number(limit))

  const total = await Timetable.countDocuments(query)

  res.status(200).json({
    success: true,
    count: timetables.length,
    total,
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit)
    },
    data: timetables
  })
})

/* ============================================================
   🟢 GET TIMETABLE BY BRANCH + SECTION (for Students)
   Route: GET /api/timetable/:branch/:section?year=3rd%20Year
   Access: Public
============================================================ */
export const getTimetableByBranchSection = asyncHandler(async (req, res, next) => {
  const { branch, section } = req.params
  const { year } = req.query

  

  const timetable = await Timetable.findOne({
    year,
    branch: branch.toUpperCase(),
    section: section.toUpperCase(),
    isPublished: true
  }).populate('createdBy', 'username firstName lastName')

  if (!timetable) {
  return res.status(200).json({
    success: true,
    data: null,
    message: 'No published timetable yet'
  });
}


  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

/* ============================================================
   🟢 VIEW TIMETABLE (by Query Params)
   Route: GET /api/timetable/view?year=3&branch=CSE&section=A
   Access: Public
============================================================ */
export const viewTimetable = asyncHandler(async (req, res, next) => {
  const { year, branch, section } = req.query

  if (!year || !branch || !section) {
    return next(new AppError('Year, branch, and section are required', 400))
  }

  const yearMapping = {
    '1': '1st Year',
    '2': '2nd Year',
    '3': '3rd Year',
    '4': '4th Year'
  }
  const mappedYear = yearMapping[year] || year

  const timetable = await Timetable.findOne({
    year: mappedYear,
    branch: branch.toUpperCase(),
    section: section.toUpperCase(),
    isPublished: true
  }).populate('createdBy', 'username firstName lastName')

  if (!timetable) {
  return res.status(200).json({
    success: true,
    data: null,
    message: 'No published timetable yet'
  });
}


  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

/* ============================================================
   🟢 GET TEACHER TIMETABLE
   Route: GET /api/timetable/teacher/:id
   Access: Public or Protected
============================================================ */

export const getBusyTeachersForSlot = async (req, res) => {
  try {
    const { day, slotKey, timeSlot, branch, year, section } = req.query;
    if (!day || (!slotKey && !timeSlot)) {
      return res.status(400).json({ success: false, message: 'day and slotKey|timeSlot required' });
    }
    const slot = slotKey || timeSlot;

    const match = { 'schedule.day': day, 'schedule.timeSlot': slot };
    if (branch) match.branch = branch;
    if (year) match.year = year;
    if (section) match.section = section;

   // --- PATCH START ---
// aggregate teachers busy in this day+slot with class context
const agg = [
  { $match: match },
  { $unwind: "$schedule" },
  {
    $match: {
      "schedule.day": day,
      "schedule.timeSlot": slot
    }
  },
  {
    $project: {
      teacherId_field: { $ifNull: ["$schedule.teacher._id", "$schedule.teacher.id"] },
      teacherAltId: "$schedule.teacherId",
      teacherUsername: "$schedule.teacher.username",
      teacherName: "$schedule.teacher.name",
      year: 1,
      branch: 1,
      section: 1,
      subject: {
        $ifNull: [
          "$schedule.subject.acronym",
          "$schedule.subject.name"
        ]
      },
      type: "$schedule.type",
      timeSlot: "$schedule.timeSlot"
    }
  },
  {
    $addFields: {
      teacherCandidate: {
        $ifNull: [
          "$teacherId_field",
          { $ifNull: ["$teacherAltId", "$teacherUsername"] }
        ]
      },
      classLabel: {
        $concat: [
          { $ifNull: ["$year", ""] },
          " ",
          { $ifNull: ["$branch", ""] },
          "-",
          { $ifNull: ["$section", ""] }
        ]
      },
     classDetail: {
  $concat: [
    { $ifNull: ["$subject", "Class"] },
    " • ",
    {
      $cond: [
        { $eq: ["$type", "Split Lab (B1/B2)"] },
        "Split Lab (B1/B2)",
        { $ifNull: ["$type", "Lecture"] }
      ]
    },
    " • ",
    { $ifNull: ["$timeSlot", ""] }
  ]
}

    }
  },
  {
    $group: {
      _id: "$teacherCandidate",
      name: { $first: "$teacherName" },
      username: { $first: "$teacherUsername" },
      teacherAltId: { $first: "$teacherAltId" },
      classLabel: { $first: "$classLabel" },
      classDetail: { $first: "$classDetail" }
    }
  },
  {
  $project: {
    _id: 0,
    id: { $toString: "$_id" },
    name: 1,
    username: 1,
    teacherId: "$teacherAltId",
    busy: { $literal: true },

    // ✅ Fix 1: Compute and return classInfo directly
    classInfo: {
  $trim: {
    input: {
      $concat: [
        { $ifNull: ["$classLabel", ""] },
        {
          $cond: [
            { $and: [{ $ne: ["$classDetail", null] }, { $ne: ["$classDetail", ""] }] },
            { $concat: [" (", "$classDetail", ")"] },
            ""
          ]
        }
      ]
    }
  }
},


    // ✅ Fix 2: Keep fields separate too (debug-friendly)
    classLabel: 1,
    classDetail: 1
  }
}

  
];

const busyTeachers = await Timetable.aggregate(agg).allowDiskUse(true);
// --- PATCH END ---


    // For backward compatibility: list of string ids
    const rawList = busyTeachers.map(t => String(t.id)).filter(Boolean);
    const usernames = busyTeachers.map(t => t.username).filter(Boolean);

    return res.json({
      success: true,
      busyTeachers: rawList,
      busyTeacherUsernames: usernames,
      busyTeachersDetails: busyTeachers
    });
  } catch (err) {
    console.error('getBusyTeachersForSlot error', err);
    return res.status(500).json({ success: false, message: err.message || 'Server error' });
  }
};

/**
 * GET /api/timetable/teacher/:id  OR /api/timetable/teacher?teacherId=<idOrUsername>
 * Returns timetable entries for a teacher across timetables. If route param is 'all' respond with message.
 *
 * This function is tolerant and looks for:
 * - schedule.teacher.id (db object id string)
 * - schedule.teacher._id
 * - schedule.teacherId (custom teacher short id)
 * - schedule.teacher.username
 *
 * Returns structure:
 *  { success: true, data: [ { timetableId, branch, year, section, academicYear, entries: [ { day, timeSlot, subject, type, room, teacher... } ] } ] }
 */
// backend/src/controllers/timetableController.js


// GET TEACHER TIMETABLE (Flexible Matching)
export const getTeacherTimetable = asyncHandler(async (req, res) => {
  const lookup = req.params.id || req.query.teacherId || req.query.id || req.query.name;
  if (!lookup) throw new AppError('Teacher ID or Name is required', 400);

  // 1) Find teacher by ID, teacherId, or name (Flexible)
  const teacher = await User.findOne({
    role: 'teacher',
    $or: [
      mongoose.isValidObjectId(lookup) ? { _id: lookup } : null,
      { teacherId: lookup },
      { normalizedName: new RegExp(lookup.toLowerCase(), 'i') },
      { displayName: new RegExp(lookup, 'i') }
    ].filter(Boolean)
  }).lean();

  if (!teacher) throw new AppError('Teacher not found', 404);

  // 2) Find ALL published timetables where teacher is present (Flexible matching in schedule)
  const tts = await Timetable.find({
    isPublished: true,
    $or: [
      { 'schedule.teacher.id': teacher._id },                // Match by MongoDB _id
      { 'schedule.teacherId': teacher.teacherId },          // Match by custom teacherId
      { 'schedule.teacher.name': new RegExp(teacher.firstName.split(' ')[0], 'i') } // Match by partial name (e.g. "Tushar")
    ]
  }).sort({ publishedAt: -1, updatedAt: -1 }).lean();

  if (!tts.length) {
    return res.status(404).json({ success: false, message: 'No teaching schedule found' });
  }

  // 3) Extract matching schedule entries
  const entries = [];
  for (const tt of tts) {
    for (const s of tt.schedule || []) {
      const match =
        (s?.teacher?.id && String(s.teacher.id) === String(teacher._id)) ||
        (s?.teacher?.name && new RegExp(teacher.firstName.split(' ')[0], 'i').test(s.teacher.name)) ||
        (s?.teacherId && s.teacherId === teacher.teacherId);

      if (!match) continue;

      entries.push({
        timetableId: tt._id,
        academicYear: tt.academicYear,
        semester: tt.semester,
        branch: tt.branch,
        year: tt.year,
        section: tt.section,
        day: s.day,
        slotKey: s.slotKey || null,
        timeSlot: s.timeSlot || '',
        subject: s.subject?.name || s.subject?.acronym || '',
        class: `${tt.year} ${tt.branch} ${tt.section}`,
        room: s.room || '',
        type: s.type || 'lecture',
      });
    }
  }

  if (!entries.length) {
    return res.status(404).json({ success: false, message: 'No teaching schedule found' });
  }

  // 4) Build days and timeslot grid
  const DAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const timeSlotSet = [...new Set(entries.map(e => e.timeSlot))];
  const timeSlots = timeSlotSet;
  const days = DAY_ORDER.filter(d => entries.some(e => e.day === d));

  const scheduleGrid = {};
  for (const d of days) {
    scheduleGrid[d] = {};
    for (const t of timeSlots) scheduleGrid[d][t] = null;
  }

  for (const e of entries) {
    if (!scheduleGrid[e.day]) continue;
    const slot = e.timeSlot;
    if (!scheduleGrid[e.day][slot]) {
      scheduleGrid[e.day][slot] = e;
    } else {
      const existing = scheduleGrid[e.day][slot];
      if (Array.isArray(existing)) existing.push(e);
      else scheduleGrid[e.day][slot] = [existing, e];
    }
  }

  const latestAY = tts[0]?.academicYear || entries[0]?.academicYear || '';

  return res.json({
    success: true,
    data: {
      teacher: {
        id: String(teacher._id),
        name: teacher.displayName,
        department: teacher.department || '',
        teacherId: teacher.teacherId || '',
      },
      meta: {
        latestAcademicYear: latestAY,
        classes: [...new Set(entries.map(e => `${e.year} ${e.branch} ${e.section} (${e.academicYear})`))],
      },
      grid: { days, timeSlots, schedule: scheduleGrid },
      flat: entries,
    }
  });
});





/* ============================================================
   🟢 GET TIMETABLE BY CLASS (for Coordinators)
   Route: GET /api/timetable/class?year=3rd&branch=CSE&section=A
   Access: Private (Coordinator)
============================================================ */
export const getTimetableByClass = asyncHandler(async (req, res, next) => {
  const { year, branch, section } = req.query
  if (!year || !branch || !section) {
    return next(new AppError('Year, branch, and section are required', 400))
  }

  const timetable = await Timetable.findOne({
    year,
    branch: branch.toUpperCase(),
    section: section.toUpperCase()
  })
    .sort({ updatedAt: -1 })
    .populate('createdBy', 'username firstName lastName')

  if (!timetable) return next(new AppError('Timetable not found', 404))

  const days = [...new Set(timetable.schedule.map(s => s.day))].filter(Boolean)
  const timeSlots = [...new Set(timetable.schedule.map(s => s.timeSlot))].filter(Boolean)

  res.status(200).json({
    success: true,
    data: { ...timetable.toObject(), days, timeSlots }
  })
})

/* ============================================================
   🟢 CREATE TIMETABLE
   Route: POST /api/timetable
   Access: Private (Coordinator)
============================================================ */
export const createTimetable = asyncHandler(async (req, res, next) => {
  // Normalize BEFORE validation
  if (req.body.branch) req.body.branch = req.body.branch.toUpperCase().trim();
  if (req.body.section) req.body.section = req.body.section.toUpperCase().trim();

  const errors = validationResult(req)
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400))

  const { year, branch, section, semester, academicYear, schedule } = req.body

  // --- Normalize branch and section casing before saving ---
  if (branch) req.body.branch = branch.toUpperCase();
  if (section) req.body.section = section.toUpperCase();

  const existing = await Timetable.findOne({ year, branch: req.body.branch, section: req.body.section })
  if (existing) {
    return res.status(200).json({
      success: true,
      message: 'Timetable already exists. Use update endpoint to modify it.',
      data: existing,
      exists: true
    })
  }

  const processedSchedule = (schedule || []).map(slot => ({
    day: slot.day,
    timeSlot: slot.timeSlot,
    subject: {
      acronym: slot.subject?.acronym || slot.subject || '',
      code: slot.subject?.code || '',
      name: slot.subject?.name || slot.subject?.acronym || slot.subject || ''
    },
    teacher: (() => {
     // Normalize teacher formats (string / object / missing)
      if (!slot.teacher) return { id: null, name: '', username: '' };
      if (typeof slot.teacher === 'string') return { id: null, name: slot.teacher, username: '' };
      return {
        id: slot.teacher.id || null,
        name: slot.teacher.name || '',
        username: slot.teacher.username || ''
      };
    })(),
    type: slot.type || 'lecture',
    room: slot.room || ''
  }))

  const timetable = await Timetable.create({
    year,
    branch: req.body.branch,
    section: req.body.section,
    semester,
    academicYear,
    schedule: processedSchedule,
    createdBy: req.user?._id || null
  })

  await timetable.populate('createdBy', 'username firstName lastName')

  res.status(201).json({ success: true, data: timetable })
})

/* ============================================================
   🟢 UPDATE TIMETABLE
   Route: PUT /api/timetable/:id
   Access: Private (Coordinator)
============================================================ */
/* ============================================================
   🟢 UPDATE TIMETABLE
   Route: PUT /api/timetable/:id
   Access: Private (Coordinator)
============================================================ */
export const updateTimetable = asyncHandler(async (req, res, next) => {
  // ✅ Normalize branch/section before validation or update
  if (req.body.branch) req.body.branch = req.body.branch.toUpperCase().trim();
  if (req.body.section) req.body.section = req.body.section.toUpperCase().trim();

  let timetable = await Timetable.findById(req.params.id);
  if (!timetable) return next(new AppError('Timetable not found', 404));

  // ✅ SAFELY normalize schedule before saving (prevents crash)
  if (req.body.schedule) {
    req.body.schedule = req.body.schedule.map(slot => ({
      day: slot.day,
      timeSlot: slot.timeSlot,
      subject: {
        acronym: slot.subject?.acronym || slot.subject || '',
        code: slot.subject?.code || '',
        name: slot.subject?.name || slot.subject?.acronym || slot.subject || ''
      },
      teacher: (() => {
        // Handle split-lab or missing teacher safely
        if (!slot.teacher) return { id: null, name: '', username: '' };
        if (typeof slot.teacher === 'string') return { id: null, name: slot.teacher, username: '' };
        return {
          id: slot.teacher.id || null,
          name: slot.teacher.name || '',
          username: slot.teacher.username || ''
        };
      })(),
      type: slot.type || 'lecture',
      room: slot.room || ''
    }));
  }

  // ✅ Apply update after cleaning data
  timetable = await Timetable.findByIdAndUpdate(
    req.params.id,
    { ...req.body, lastModifiedBy: req.user?.id || null },
    { new: true, runValidators: true }
  ).populate('createdBy lastModifiedBy', 'username firstName lastName');

  res.status(200).json({ success: true, data: timetable });
});


/* ============================================================
   🟢 PUBLISH / UNPUBLISH TIMETABLE
   Route: PUT /api/timetable/:id/publish
   Access: Private (Coordinator)
============================================================ */
/* ============================================================
   🟢 PUBLISH / UNPUBLISH TIMETABLE
   Route: PUT /api/timetable/:id/publish
   Access: Private (Coordinator)
============================================================ */
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

  // ✅ Build full coordinator name (safe and formatted)
  // ✅ Prefer name sent from frontend, else fallback to logged-in user info
const coordinatorName = req.body.coordinatorName?.trim() || (() => {
  const salutation = req.user?.salutation ? `${req.user.salutation}.` : "Mr.";
  const first = req.user?.firstName?.trim() || "";
  const last = req.user?.lastName?.trim() || "";
  return [salutation, first, last].filter(Boolean).join(" ").trim();
})();

  const timetable = await Timetable.findOne(filter);

  // ✅ Base fields to set (publish metadata + last modified info)
  const baseSet = {
    schedule,
    isPublished: !!isPublished,
    publishedAt: isPublished ? new Date() : null,
    lastModifiedBy: userId,
    createdBy: userId,
    updatedAt: new Date(),
  };

  // ✅ Store coordinator name only when publishing (once per publish)
  if (isPublished) {
    baseSet.coordinatorName = coordinatorName;
  }

  const update = { $set: baseSet };

  // ✅ Version tracking (only if timetable already exists)
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

  // ✅ Update or create timetable
  const updated = await Timetable.findOneAndUpdate(filter, update, {
    new: true,
    upsert: true,
    runValidators: true
  }).populate('createdBy lastModifiedBy', 'username firstName lastName');

  // ✅ Notify subscribers (optional)
  if (isPublished && userId) {
    await createTimetableNotification(updated._id, 'timetable_published', userId);
  }

  res.status(200).json({
    success: true,
    message: `Timetable ${isPublished ? 'published' : 'unpublished'} successfully`,
    data: updated
  });
});



/* ============================================================
   🟢 DELETE TIMETABLE
   Route: DELETE /api/timetable/:id
   Access: Private (Coordinator)
============================================================ */
export const deleteTimetable = asyncHandler(async (req, res, next) => {
  const timetable = await Timetable.findById(req.params.id)
  if (!timetable) return next(new AppError('Timetable not found', 404))

  await timetable.deleteOne()
  res.status(200).json({ success: true, message: 'Timetable deleted successfully' })
})

/* ============================================================
   🟢 GET TIMETABLE STATISTICS
   Route: GET /api/timetable/stats
   Access: Private (Coordinator)
============================================================ */
export const getTimetableStats = asyncHandler(async (req, res, next) => {
  const stats = await Timetable.aggregate([
    {
      $group: {
        _id: null,
        totalTimetables: { $sum: 1 },
        publishedTimetables: { $sum: { $cond: [{ $eq: ['$isPublished', true] }, 1, 0] } },
        draftTimetables: { $sum: { $cond: [{ $eq: ['$isPublished', false] }, 1, 0] } }
      }
    }
  ])

  const branchStats = await Timetable.aggregate([{ $group: { _id: '$branch', count: { $sum: 1 } } }])

  res.status(200).json({
    success: true,
    data: {
      overview: stats[0] || { totalTimetables: 0, publishedTimetables: 0, draftTimetables: 0 },
      branchStats
    }
  })
})