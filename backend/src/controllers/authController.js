import jwt from 'jsonwebtoken'
import { validationResult } from 'express-validator'
import User from '../models/User.js'
import { AppError } from '../utils/errorHandler.js'
import { asyncHandler } from '../utils/errorHandler.js'

// Generate JWT Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}

// Send token response
const sendTokenResponse = (user, statusCode, res) => {
  const token = generateToken(user._id)

  const options = {
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
  }

  // Get the display name using the virtual field logic
  const getDisplayName = (user) => {
    if (user.role === 'coordinator') {
      return user.cname
    }
    return user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username
  }

  res.status(statusCode)
    .cookie('token', token, options)
    .json({
      success: true,
      token,
      user: {
        id: user._id,
        username: user.username,
        coordinatorId: user.coordinatorId,
        cname: user.cname,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        displayName: getDisplayName(user),
        department: user.department,
        branch: user.branch,
        year: user.year
      }
    })
}

// @desc    Register coordinator
// @route   POST /api/auth/register-coordinator
// @access  Public
export const registerCoordinator = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    console.log('Validation errors:', errors.array()) // Add logging for debugging
    console.log('Request body:', req.body) // Log the request body
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const { coordinatorId, cname, branch, year, password } = req.body
  
  // Log the extracted values
  console.log('Extracted values:', { coordinatorId, cname, branch, year, password: '***' })

  // Check if coordinator exists
  const existingCoordinator = await User.findOne({
    $or: [{ username: coordinatorId }, { coordinatorId }]
  })

  if (existingCoordinator) {
    return next(new AppError('Coordinator already exists with this ID', 400))
  }

  // Create coordinator - no email field at all
  const coordinator = await User.create({
    username: coordinatorId,
    coordinatorId,
    cname,
    branch,
    year,
    password,
    role: 'coordinator'
  })

  sendTokenResponse(coordinator, 201, res)
})

// @desc    Register user (legacy)
// @route   POST /api/auth/register
// @access  Public (but only for teachers/coordinators)
export const register = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const { username, password, role, firstName, lastName, department } = req.body

  // Check if user exists
  const existingUser = await User.findOne({ username })

  if (existingUser) {
    return next(new AppError('User already exists with this username', 400))
  }

  // Create user
  const user = await User.create({
    username,
    password,
    role,
    firstName: firstName || '',
    lastName: lastName || '',
    department: department || ''
  })

  sendTokenResponse(user, 201, res)
})

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const { username, password } = req.body

  // Check for user
  const user = await User.findOne({ username }).select('+password')

  if (!user || !(await user.matchPassword(password))) {
    return next(new AppError('Invalid credentials', 401))
  }

  if (!user.isActive) {
    return next(new AppError('Account is deactivated', 401))
  }

  // Role guard check
  if (!['coordinator', 'teacher'].includes(user.role)) {
    return next(new AppError('Unauthorized role', 403))
  }

  sendTokenResponse(user, 200, res)
})

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = asyncHandler(async (req, res, next) => {
  const user = await User.findById(req.user.id)

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      coordinatorId: user.coordinatorId,
      cname: user.cname,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      displayName: user.displayName,
      department: user.department,
      createdBy: user.createdBy,
      branch: user.branch,
      year: user.year
    }
  })
})

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
export const logout = asyncHandler(async (req, res, next) => {
  res.cookie('token', 'none', {
    expires: new Date(Date.now() + 10 * 1000),
    httpOnly: true
  })

  res.status(200).json({
    success: true,
    message: 'User logged out successfully'
  })
})

// @desc    Update user details
// @route   PUT /api/auth/updatedetails
// @access  Private
export const updateDetails = asyncHandler(async (req, res, next) => {
  const fieldsToUpdate = {
    username: req.body.username,
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    department: req.body.department
  }

  const user = await User.findByIdAndUpdate(req.user.id, fieldsToUpdate, {
    new: true,
    runValidators: true
  })

  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      username: user.username,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      department: user.department,
      branch: user.branch,
      year: user.year
    }
  })
})

// @desc    Update password
// @route   PUT /api/auth/updatepassword
// @access  Private
export const updatePassword = asyncHandler(async (req, res, next) => {
  // Check for validation errors
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const user = await User.findById(req.user.id).select('+password')

  // Check current password
  if (!(await user.matchPassword(req.body.currentPassword))) {
    return next(new AppError('Password is incorrect', 401))
  }

  user.password = req.body.newPassword
  await user.save()

  sendTokenResponse(user, 200, res)
})