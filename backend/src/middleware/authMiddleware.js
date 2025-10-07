import jwt from 'jsonwebtoken'
import { asyncHandler } from '../utils/errorHandler.js'
import { AppError } from '../utils/errorHandler.js'
import User from '../models/User.js'

// Protect routes
export const protect = asyncHandler(async (req, res, next) => {
  let token

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    // Set token from Bearer token in header
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies.token) {
    // Set token from cookie
    token = req.cookies.token
  }

  // Make sure token exists
  if (!token) {
    return next(new AppError('Not authorized to access this route', 401))
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    // Get user from token
    req.user = await User.findById(decoded.id)

    if (!req.user) {
      return next(new AppError('No user found with this id', 404))
    }

    if (!req.user.isActive) {
      return next(new AppError('User account is deactivated', 401))
    }

    next()
  } catch (err) {
    return next(new AppError('Not authorized to access this route', 401))
  }
})

// Grant access to specific roles
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return next(new AppError(`User role ${req.user.role} is not authorized to access this route`, 403))
    }
    next()
  }
}