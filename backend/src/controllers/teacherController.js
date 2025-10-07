import User from '../models/User.js'
import { AppError } from '../utils/errorHandler.js'
import { asyncHandler } from '../utils/errorHandler.js'

// @desc    Get all teachers (public for teacher selection)
// @route   GET /api/teachers/all
// @access  Public
export const getAllTeachers = asyncHandler(async (req, res, next) => {
  const { branch } = req.query
  
  let filter = {
    role: 'teacher',
    isActive: true
  }
  
  // If branch is specified, filter by coordinator's branch
  if (branch) {
    const coordinators = await User.find({ role: 'coordinator', branch })
    const coordinatorIds = coordinators.map(coord => coord._id)
    filter.createdBy = { $in: coordinatorIds }
  }

  const teachers = await User.find(filter)
    .select('username firstName lastName department displayName')
    .populate('createdBy', 'branch year')
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
      department: teacher.department,
      branch: teacher.createdBy?.branch || 'cse',
      year: teacher.createdBy?.year
    }))
  })
})

// @desc    Get single teacher
// @route   GET /api/teachers/:id
// @access  Public
export const getTeacherById = asyncHandler(async (req, res, next) => {
  const teacher = await User.findOne({
    _id: req.params.id,
    role: 'teacher',
    isActive: true
  }).select('username firstName lastName department displayName')
    .populate('createdBy', 'branch year')

  if (!teacher) {
    return next(new AppError('Teacher not found', 404))
  }

  res.status(200).json({
    success: true,
    data: {
      id: teacher._id,
      username: teacher.username,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      displayName: teacher.displayName,
      department: teacher.department,
      branch: teacher.createdBy?.branch,
      year: teacher.createdBy?.year
    }
  })
})