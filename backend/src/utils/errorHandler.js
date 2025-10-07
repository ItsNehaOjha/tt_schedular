// Custom error class
export class AppError extends Error {
  constructor(message, statusCode) {
    super(message)
    this.statusCode = statusCode
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error'
    this.isOperational = true

    Error.captureStackTrace(this, this.constructor)
  }
}

// Global error handler middleware
export const globalErrorHandler = (err, req, res, next) => {
  let error = { ...err }
  error.message = err.message

  // Log error
  console.error('Error:', err)

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found'
    error = new AppError(message, 404)
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered'
    error = new AppError(message, 400)
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const errors = Object.values(err.errors).map(val => {
      // Convert technical MongoDB path messages to user-friendly messages
      let message = val.message
      
      // Handle common validation patterns
      if (message.includes("Path 'teacher.name' is required")) {
        return 'Teacher name is required'
      }
      if (message.includes("Path 'subject.acronym' is required")) {
        return 'Subject is required'
      }
      if (message.includes("Path 'timeSlot' is required")) {
        return 'Time slot is required'
      }
      if (message.includes("Path 'day' is required")) {
        return 'Day is required'
      }
      if (message.includes("Path 'year' is required")) {
        return 'Year is required'
      }
      if (message.includes("Path 'branch' is required")) {
        return 'Branch is required'
      }
      if (message.includes("Path 'section' is required")) {
        return 'Section is required'
      }
      if (message.includes("Path 'semester' is required")) {
        return 'Semester is required'
      }
      if (message.includes("Path 'academicYear' is required")) {
        return 'Academic year is required'
      }
      
      // Remove "Path" prefix from other messages
      message = message.replace(/^Path\s+'([^']+)'\s+/, '')
      
      return message
    })
    
    const message = errors.join(', ')
    error = new AppError(message, 400)
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token'
    error = new AppError(message, 401)
  }

  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired'
    error = new AppError(message, 401)
  }

  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  })
}

// Async error handler wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}