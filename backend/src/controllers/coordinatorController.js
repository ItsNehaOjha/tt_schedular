// backend/src/controllers/coordinatorController.js
import { validationResult } from 'express-validator';
import User from '../models/User.js';
import { asyncHandler, AppError } from '../utils/errorHandler.js';

/**
 * Coordinators may add teachers WITHOUT username/password.
 * This creates role:'teacher' records only.
 */

import { nextTeacherId } from "../utils/teacherId.js";

export const createTeacher = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return next(new AppError(errors.array()[0].msg, 400));

  const { firstName, lastName = "", department = "", designation = "", specialization = [], experience = "" } = req.body;

  if (!firstName?.trim()) return next(new AppError("firstName is required for teacher", 400));

  // normalized name (strip titles, case/space insensitive)
  const normalizedName = `${firstName} ${lastName}`.toLowerCase()
    .replace(/\b(dr\.|mr\.|ms\.|mrs\.|prof\.)\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  // avoid duplicate teacher by name + department
  const dup = await User.findOne({ role: "teacher", normalizedName, department: department.trim() });
  if (dup) return next(new AppError("Teacher already exists in this department", 409));

  // allocate a fresh, non-colliding teacherId
  const teacherId = await nextTeacherId(department);

  const teacher = await User.create({
    role: "teacher",
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    department: department.trim(),
    designation: designation.trim?.() || "",
    specialization: Array.isArray(specialization) ? specialization : [],
    experience: experience || "",
    isActive: true,
    normalizedName,
    teacherId,
    createdBy: req.user?._id,
  });

  res.status(201).json({
    success: true,
    message: "Teacher created",
    data: {
      id: teacher._id,
      teacherId: teacher.teacherId,
      name: teacher.displayName,
      department: teacher.department,
      designation: teacher.designation || "",
    },
  });
});


/**
 * List teachers (same as teacherController.listTeachers but kept for coordinator routes compatibility)
 * GET /api/coordinator/teachers
 */
export const getTeachers = asyncHandler(async (req, res, next) => {
  const list = await User.find({ role: 'teacher', isActive: true })
    .sort({ department: 1, firstName: 1, lastName: 1 });

  res.json({
    success: true,
    count: list.length,
    data: list.map(t => ({
      id: t._id,
      teacherId: t.teacherId,
      name: t.displayName || `${t.firstName ?? ''} ${t.lastName ?? ''}`.trim(),
      department: t.department || '',
      designation: t.designation || ''
    }))
  });
});

/**
 * Update & Delete delegate to teacherController via routes or keep thin wrappers if you prefer.
 * Keeping coordinator access policy centralized in coordinatorRoutes.
 */
