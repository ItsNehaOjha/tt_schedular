import { validationResult } from 'express-validator'
import User from '../models/User.js'
import { AppError } from '../utils/errorHandler.js'
import { asyncHandler } from '../utils/errorHandler.js'
import { predefinedTeachers, generateDefaultPassword } from '../utils/predefinedTeachers.js'

// @desc    Get all teachers created by coordinator
// @route   GET /api/coordinator/teachers
// @access  Private (Coordinator only)
export const getTeachers = asyncHandler(async (req, res, next) => {
  const teachers = await User.find({
    role: 'teacher',
    createdBy: req.user.id,
    isActive: true
  }).select('username firstName lastName department displayName')
    .sort({ firstName: 1, lastName: 1 })

  res.status(200).json({
    success: true,
    count: teachers.length,
    data: teachers.map(teacher => ({
      id: teacher._id,
      username: teacher.username,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      displayName: teacher.displayName || `${teacher.firstName || ''} ${teacher.lastName || ''}`.trim() || teacher.username,
      department: teacher.department
    }))
  })
})

// @desc    Create teacher
// @route   POST /api/coordinator/create-teacher
// @access  Private (Coordinator only)
export const createTeacher = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const { username, firstName, lastName, department, password } = req.body

  // Check if teacher already exists
  const existingTeacher = await User.findOne({ username })
  if (existingTeacher) {
    return next(new AppError('Teacher with this username already exists', 400))
  }

  const teacher = await User.create({
    username,
    firstName: firstName || '',
    lastName: lastName || '',
    department: department || '',
    password: password || 'teacher123',
    role: 'teacher',
    createdBy: req.user.id
  })

  res.status(201).json({
    success: true,
    message: 'Teacher created successfully',
    data: {
      id: teacher._id,
      username: teacher.username,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      displayName: teacher.displayName,
      department: teacher.department
    }
  })
})

// @desc    Update teacher
// @route   PUT /api/coordinator/teachers/:id
// @access  Private (Coordinator only)
export const updateTeacher = asyncHandler(async (req, res, next) => {
  const { firstName, lastName, department } = req.body

  const teacher = await User.findOneAndUpdate(
    { 
      _id: req.params.id, 
      role: 'teacher', 
      createdBy: req.user.id 
    },
    { firstName, lastName, department },
    { new: true, runValidators: true }
  ).select('username firstName lastName department displayName')

  if (!teacher) {
    return next(new AppError('Teacher not found or not authorized', 404))
  }

  res.status(200).json({
    success: true,
    message: 'Teacher updated successfully',
    data: {
      id: teacher._id,
      username: teacher.username,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      displayName: teacher.displayName,
      department: teacher.department
    }
  })
})

// @desc    Delete teacher
// @route   DELETE /api/coordinator/teachers/:id
// @access  Private (Coordinator only)
export const deleteTeacher = asyncHandler(async (req, res, next) => {
  const teacher = await User.findOneAndUpdate(
    { 
      _id: req.params.id, 
      role: 'teacher', 
      createdBy: req.user.id 
    },
    { isActive: false },
    { new: true }
  )

  if (!teacher) {
    return next(new AppError('Teacher not found or not authorized', 404))
  }

  res.status(200).json({
    success: true,
    message: 'Teacher deleted successfully'
  })
})

// @desc    Initialize predefined CSE teachers
// @route   POST /api/coordinator/teachers/initialize
// @access  Private (Coordinator only)
export const initializePredefinedTeachers = asyncHandler(async (req, res, next) => {
  try {
    const createdTeachers = []
    const skippedTeachers = []

    for (const teacherData of predefinedTeachers) {
      // Check if teacher already exists
      const existingTeacher = await User.findOne({ username: teacherData.username })
      
      if (existingTeacher) {
        skippedTeachers.push(teacherData.username)
        continue
      }

      // Create teacher
      const teacher = await User.create({
        ...teacherData,
        password: generateDefaultPassword(),
        role: 'teacher',
        createdBy: req.user.id
      })

      createdTeachers.push({
        id: teacher._id,
        username: teacher.username,
        displayName: teacher.displayName
      })
    }

    res.status(201).json({
      success: true,
      message: `Initialized ${createdTeachers.length} teachers successfully`,
      data: {
        created: createdTeachers,
        skipped: skippedTeachers,
        createdCount: createdTeachers.length,
        skippedCount: skippedTeachers.length
      }
    })
  } catch (error) {
    return next(new AppError('Error initializing teachers: ' + error.message, 500))
  }
})