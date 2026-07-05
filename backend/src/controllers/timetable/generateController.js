import crypto from 'crypto';
import Timetable from '../../models/Timetable.js'
import { asyncHandler } from '../../utils/errorHandler.js'
import { isTeacherBusy } from './helpers/busyTeacherUtils.js'

export const generateSampleTimetable = asyncHandler(async (req, res) => {
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
    // Prevent replacing an existing timetable for this class when overwrite is false
    const existing = await Timetable.findOne({
      year,
      branch: branch.toUpperCase(),
      section: section.toUpperCase(),
      semester,
      academicYear
    }).lean();
    if (existing && !options.overwriteExisting) {
      return res.status(409).json({
        success: false,
        message: `Timetable already exists for ${year} ${branch.toUpperCase()}-${section.toUpperCase()} (${academicYear}).`
      });
    }

    // Create empty schedule structure
    const schedule = {};
    weekDays.forEach(day => {
      schedule[day] = {};
      timeSlots.forEach(slot => {
        schedule[day][slot] = null;
      });
    });

    // Reserve lunch slot across ALL days at the configured slot index
    if (typeof lunch?.slotIndex === 'number' && lunch.slotIndex >= 0 && lunch.slotIndex < timeSlots.length) {
      const lunchSlot = timeSlots[lunch.slotIndex];
      weekDays.forEach((day) => {
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
        const isBusy = await isTeacherBusy(
          teacherId,
          day,
          slot,
          { treatDraftsAsBusy: options.treatDraftsAsBusy, busyAcademicYear: academicYear, busySemester: semester },
          section
        );
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
        teacher: teacherId ? { id: teacherId, name: subject.teacherName || '', username: subject.teacherUsername || '' } : '',
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
          generator: 'generateSampleTimetable',
          weekDays,
          timeSlots,
          slotConfig
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
        metadata: { generatedAt: new Date(), generator: 'generateSampleTimetable', weekDays, timeSlots, slotConfig }
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
