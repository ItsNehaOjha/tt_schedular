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
const isTeacherBusy = async (teacherId, day, timeSlot, options = {}, excludeSection = null) => {
  if (!teacherId) return false;
  const { treatDraftsAsBusy = true } = options || {};

  const baseMatch = {
    'schedule.day': day,
    'schedule.timeSlot': timeSlot,
    $or: [
      { 'schedule.teacher.id': teacherId },
      { 'schedule.teacher._id': teacherId },
      { 'schedule.teacherId': teacherId },
      { 'schedule.teacher.username': teacherId }
    ]
  };

  if (excludeSection) baseMatch.section = { $ne: excludeSection };

  const visibilityMatch = treatDraftsAsBusy
    ? { $or: [{ isPublished: true }, { isDraft: true }] }
    : { isPublished: true };

  const count = await Timetable.countDocuments({ ...baseMatch, ...visibilityMatch });
  return count > 0;
};

/* ============================================================
   🟢 GENERATE SAMPLE TIMETABLE
   Route: POST /api/timetable/generate-sample
   Access: Private (Coordinator)
============================================================ */
export const generateSampleTimetable = asyncHandler(async (req, res) => {
  // Debug: log incoming payload briefly (avoid huge dumps in production)
  try { console.log('🧩 Received Payload (generate-sample):', {
    branch: req.body?.branch,
    year: req.body?.year,
    semester: req.body?.semester,
    sections: Array.isArray(req.body?.sections) ? req.body.sections : [],
    weekDays: req.body?.weekDays,
    slotConfig: req.body?.slotConfig,
    lunch: req.body?.lunch,
    perSectionSubjects_keys: req.body?.perSectionSubjects ? Object.keys(req.body.perSectionSubjects) : [],
    options: req.body?.options
  }); } catch {}
  const {
    branch,
    year,
    semester,
    sections = [],
    weekDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
    slotConfig = { startAt: "08:50", slotMinutes: 50, slotsPerDay: 8 },
    lunch = { dayIndex: 2, slotIndex: 3, label: 'Lunch' },
    perSectionSubjects = {},
    subjectFrequencies = [],
    labsBatchingRules = {},
    teacherPreferences = [],
    options = { avoidTeacherClashes: true, treatDraftsAsBusy: true, overwriteExisting: false, seed: 42 },
    academicYear
  } = req.body;

  // Validate required fields (academicYear must be explicitly provided)
  if (!branch || !year || !semester || !academicYear) {
    return res.status(400).json({
      success: false,
      message: "Branch, year, semester, and academic year are required"
    });
  }

  // Get all sections if not specified
  let sectionsToGenerate = [...sections];
  if (sectionsToGenerate.length === 0) {
    // Find all sections for this branch/year/semester
    const existingTimetables = await Timetable.find({
      branch: branch.toUpperCase(),
      year,
      semester
    }).distinct('section');
    
    if (existingTimetables.length > 0) {
      sectionsToGenerate = existingTimetables;
    } else {
      // Default sections if none found
      sectionsToGenerate = ['A', 'B', 'C'];
    }
  }

  // Initialize random number generator with seed
  const rng = crypto.createHash('sha256')
    .update(String(options.seed || Date.now()))
    .digest('hex');
  
  // Function to get deterministic random number between 0 and 1
  let rngCounter = 0;
  const getRandom = () => {
    const hash = crypto.createHash('sha256')
      .update(rng + String(rngCounter++))
      .digest('hex');
    return parseInt(hash.substring(0, 8), 16) / 0xffffffff;
  };

  // Generate time slots based on configuration
  const generateTimeSlots = () => {
    const slots = [];
    const [startHour, startMinute] = slotConfig.startAt.split(':').map(Number);
    let currentMinutes = startHour * 60 + startMinute;
    
    for (let i = 0; i < slotConfig.slotsPerDay; i++) {
      const startTime = formatMinutesToTime(currentMinutes);
      const endTime = formatMinutesToTime(currentMinutes + slotConfig.slotMinutes);
      slots.push(`${startTime}-${endTime}`);
      currentMinutes += slotConfig.slotMinutes;
    }
    
    return slots;
  };
  
  // Format minutes to time (24h HH:MM) for better frontend grid compatibility
  const formatMinutesToTime = (minutes) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`;
  };
  
  const timeSlots = generateTimeSlots();
  
  // Track teacher availability across all sections
  const teacherAvailability = {};
  
  // Store generated timetables and warnings
  const generatedTimetables = {};
  const warnings = [];
  const placedCounts = {};
  
  // Decide which sections to generate: prefer provided list; fallback to perSectionSubjects keys
 // ✅ Avoid redeclaration — extend existing variable instead
if (!sectionsToGenerate.length) {
  sectionsToGenerate = Object.keys(perSectionSubjects || {});
}


  // Process each section
  for (const section of sectionsToGenerate) {
    const providedRows = Array.isArray(perSectionSubjects?.[section]) ? perSectionSubjects[section] : [];
    console.log('➡ Section', section, 'subjects received:', providedRows.length);
    if (!providedRows.length) {
      warnings.push(`No subjects provided for section ${section}; skipping generation for this section.`);
      continue;
    }
    // Create empty schedule structure
    const schedule = {};
    weekDays.forEach(day => {
      schedule[day] = {};
      timeSlots.forEach(slot => {
        schedule[day][slot] = null;
      });
    });

    // Reserve lunch slot across all days
    if (typeof lunch?.slotIndex === 'number' && lunch.slotIndex >= 0 && lunch.slotIndex < timeSlots.length) {
      const lunchSlot = timeSlots[lunch.slotIndex];
      weekDays.forEach((day, idx) => {
        // If dayIndex is specified, optionally enforce only that day; else fill all days
        if (typeof lunch?.dayIndex === 'number' && lunch.dayIndex >= 0) {
          if (idx !== lunch.dayIndex) return;
        }
        schedule[day][lunchSlot] = {
          subject: lunch.label || 'LUNCH',
          type: 'lunch',
          room: ''
        };
      });
    }
    
    // Determine subjects for this section
    const sectionSubjects = providedRows.length ? providedRows : subjectFrequencies;

    // Create placement tokens for each subject based on weekly frequency
    const subjectTokens = [];
    
    sectionSubjects.forEach(subject => {
      for (let i = 0; i < subject.weekly; i++) {
        subjectTokens.push({
          ...subject,
          placementIndex: i
        });
      }
    });
    
    // Sort tokens: labs first, then lectures
    subjectTokens.sort((a, b) => {
      // Multi-slot labs first
      if (a.isLab && a.requires2Slots && !b.isLab) return -1;
      if (!a.isLab && b.isLab && b.requires2Slots) return 1;
      
      // Then regular labs
      if (a.isLab && !b.isLab) return -1;
      if (!a.isLab && b.isLab) return 1;
      
      // Then by frequency (higher frequency first)
      return b.weekly - a.weekly;
    });
    
    // Get preferred teacher for each subject
    const getPreferredTeacher = (subjectId, explicitTeacherId) => {
      if (explicitTeacherId) return explicitTeacherId;
      const preference = teacherPreferences.find(p => p.subjectId === subjectId);
      return preference ? preference.preferredTeacherId : null;
    };
    
    // Function to check if a slot is available
    const isSlotAvailable = (day, slot, requiresConsecutive = false) => {
      // Day must exist and slot must be a known key
      if (!schedule[day] || !(slot in schedule[day])) return false;

      // Current slot must be empty (null)
      if (schedule[day][slot] !== null) return false;

      // If requires consecutive slots, check next slot is present and empty
      if (requiresConsecutive) {
        const slotIndex = timeSlots.indexOf(slot);
        if (slotIndex === -1 || slotIndex >= timeSlots.length - 1) return false;
        const nextSlot = timeSlots[slotIndex + 1];
        if (!(nextSlot in schedule[day]) || schedule[day][nextSlot] !== null) return false;
      }

      return true;
    };
    
    // Function to place a subject in a slot
    const placeSubject = async (subject, day, slot, batch = null) => {
      const teacherId = getPreferredTeacher(subject.subjectId, subject.teacherId);
      
      // Check teacher availability if avoidTeacherClashes is enabled
      if (options.avoidTeacherClashes && teacherId) {
        const teacherKey = `${teacherId}:${day}:${slot}`;
        
        // If teacher is already assigned to this slot in another section
        if (teacherAvailability[teacherKey] && teacherAvailability[teacherKey] !== section) {
          const busyIn = teacherAvailability[teacherKey];
          warnings.push(`Teacher for ${subject.name} is already assigned in section ${busyIn} at ${day} ${slot}`);
          return false;
        }
        
        // Check if teacher is busy in existing timetables
        const isBusy = await isTeacherBusy(teacherId, day, slot, { treatDraftsAsBusy: options.treatDraftsAsBusy }, section);
        if (isBusy) {
          warnings.push(`Teacher for ${subject.name} is busy in an existing timetable at ${day} ${slot}`);
          return false;
        }
      }
      
      // Create the schedule entry
      const entry = {
        subject: subject.name,
        code: subject.subjectId,
        type: subject.isLab ? 'lab' : 'lecture',
        teacher: teacherId ? { id: teacherId, name: subject.teacherName || '' } : '',
        room: '',
        isLabSession: subject.isLab,
        requiresMultipleSlots: subject.requires2Slots
      };
      
      // Add batch information for split labs
      if (batch) {
        entry.batch = batch;
        entry.type = 'split-lab';
      }
      
      // Block lunch conflicts
      if (entry.type === 'lab' && typeof lunch?.slotIndex === 'number') {
        const labStartIdx = timeSlots.indexOf(slot);
        if (labStartIdx === lunch.slotIndex || labStartIdx + 1 === lunch.slotIndex) {
          warnings.push(`Lunch overlaps with lab placement for ${subject.name} at ${day} ${slot}`);
          return false;
        }
      }

      // Place in schedule
      schedule[day][slot] = entry;
      
      // If requires 2 slots, place in next slot too
      if (subject.requires2Slots && !batch) {
        const slotIndex = timeSlots.indexOf(slot);
        const nextSlot = timeSlots[slotIndex + 1];
        schedule[day][nextSlot] = { ...entry };
      }
      
      // Mark teacher as unavailable for this slot
      if (teacherId) {
        const teacherKey = `${teacherId}:${day}:${slot}`;
        teacherAvailability[teacherKey] = section;
        
        // If requires 2 slots, mark next slot too
        if (subject.requires2Slots) {
          const slotIndex = timeSlots.indexOf(slot);
          const nextSlot = timeSlots[slotIndex + 1];
          const nextTeacherKey = `${teacherId}:${day}:${nextSlot}`;
          teacherAvailability[nextTeacherKey] = section;
        }
      }
      
      return true;
    };
    
    // Place subjects in the schedule
    for (const token of subjectTokens) {
      let placed = false;
      
      // Handle split-lab (B1/B2) placement
      if (token.isLab && token.canSplitBatch) {
        // Try to place split lab in available slots
        for (const day of weekDays) {
          if (placed) break;
          
          for (let i = 0; i < timeSlots.length - 1; i++) {
            const slot = timeSlots[i];
            
            if (isSlotAvailable(day, slot, true)) {
              // Place B1 and B2 batches in parallel
              const b1Placed = await placeSubject({ ...token, name: `${token.name} (B1)` }, day, slot, 'B1');
              const b2Placed = await placeSubject({ ...token, name: `${token.name} (B2)` }, day, slot, 'B2');
              
              if (b1Placed && b2Placed) {
                placed = true;
                break;
              } else {
                // Rollback if one of the placements failed
                schedule[day][slot] = null;
                const nextSlot = timeSlots[i + 1];
                schedule[day][nextSlot] = null;
              }
            }
          }
        }
      } else {
        // Regular subject placement (lecture or non-split lab)
        const requiresConsecutive = token.isLab && token.requires2Slots;
        
        // Shuffle days for better distribution
        const shuffledDays = [...weekDays];
        for (let i = shuffledDays.length - 1; i > 0; i--) {
          const j = Math.floor(getRandom() * (i + 1));
          [shuffledDays[i], shuffledDays[j]] = [shuffledDays[j], shuffledDays[i]];
        }
        
        for (const day of shuffledDays) {
          if (placed) break;
          
          // Shuffle slots for better distribution
          const shuffledSlots = [...timeSlots];
          for (let i = shuffledSlots.length - 1; i > 0; i--) {
            const j = Math.floor(getRandom() * (i + 1));
            [shuffledSlots[i], shuffledSlots[j]] = [shuffledSlots[j], shuffledSlots[i]];
          }
          
          for (const slot of shuffledSlots) {
            if (isSlotAvailable(day, slot, requiresConsecutive)) {
              const success = await placeSubject(token, day, slot);
              if (success) {
                placed = true;
                break;
              }
            }
          }
        }
      }
      
      if (!placed) {
        warnings.push(`Could not place ${token.name} (${token.placementIndex + 1}/${token.weekly}) in section ${section}`);
      }
    }
    
    // Convert schedule to array format for storage
    const scheduleArray = [];
    Object.entries(schedule).forEach(([day, slots]) => {
      Object.entries(slots).forEach(([timeSlot, data]) => {
        if (data !== null) {
          const idx = timeSlots.indexOf(timeSlot);
          const slotKey = idx >= 0 ? `TS${idx + 1}` : (data.type === 'lunch' ? 'LUNCH' : undefined);
          scheduleArray.push({
            day,
            slotKey,
            timeSlot,
            subject: {
              name: data.subject,
              acronym: data.subject,
              code: data.code || ''
            },
            teacher: data.teacher || { id: null, name: '', username: '' },
            type: data.type || 'lecture',
            room: data.room || '',
            batch: data.batch || null
          });
        }
      });
    });
    placedCounts[section] = scheduleArray.length;
    console.log('✅ Placed entries for', section, scheduleArray.length);
    
    // Upsert draft while respecting published protection and unique index
    const classFilter = { year, branch: branch.toUpperCase(), section: section.toUpperCase(), semester, academicYear };
    let timetableDraft = await Timetable.findOne(classFilter);
    if (timetableDraft) {
      if (timetableDraft.isPublished && !options.overwriteExisting) {
        warnings.push(`Published timetable exists for ${year} ${branch.toUpperCase()} ${section}. Skipping draft generation.`);
      } else {
        // Backup metadata
        timetableDraft.metadata = { ...(timetableDraft.metadata || {}), backedUpAt: new Date() };
        // Update as draft
        timetableDraft.schedule = scheduleArray;
        timetableDraft.isPublished = false;
        timetableDraft.isDraft = true;
        timetableDraft.generatedBy = 'generator';
        timetableDraft.academicYear = academicYear;
        timetableDraft.metadata = {
          ...(timetableDraft.metadata || {}),
          generatedAt: new Date(),
          generator: 'generateSampleTimetable'
        };
        await timetableDraft.save();
      }
    } else {
      // Create a fresh draft if none exists
      await Timetable.create({
        ...classFilter,
        schedule: scheduleArray,
        isPublished: false,
        isDraft: true,
        generatedBy: 'generator',
        metadata: { generatedAt: new Date(), generator: 'generateSampleTimetable' }
      });
    }
  }

  // Respond with generation summary
  return res.json({
    success: true,
    message: 'Sample timetable generated',
    warnings,
    placedCounts
  });
});

// Fetch a draft timetable by id
export const getDraftTimetable = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const draft = await Timetable.findById(id).lean();
  if (!draft) return res.status(404).json({ success: false, message: 'Draft not found' });

  const days = [...new Set((draft.schedule || []).map(s => s.day))].filter(Boolean);
  const timeSlots = [...new Set((draft.schedule || []).map(s => s.timeSlot))].filter(Boolean);
  return res.json({ success: true, data: { ...draft, days, timeSlots } });
});

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