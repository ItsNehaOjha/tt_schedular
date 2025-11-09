import { validationResult } from 'express-validator'
import Subject from '../models/Subject.js'
import { AppError } from '../utils/errorHandler.js'
import { asyncHandler } from '../utils/errorHandler.js'
import { predefinedSubjects } from '../utils/predefinedSubjects.js'

// @desc    Get all subjects
// @route   GET /api/subjects
// @access  Public
export const getSubjects = asyncHandler(async (req, res, next) => {
  const { branch, isActive, year, semester } = req.query
  
  const filter = {}
  if (branch) filter.branches = branch
  filter.isActive = true // ensure only active subjects appear

  const parsedYear = year ? parseInt(year) : undefined
  const parsedSem = semester ? parseInt(semester) : undefined

  if (parsedYear) filter.year = parsedYear

  // Back-compat: support queries where semester may be a global number (3..8) or in-year (1..2)
  if (parsedSem) {
    // If semester is given as global and year known, map to in-year and include both
    if (parsedSem > 2 && parsedYear) {
      const inYearSem = parsedSem - (parsedYear - 1) * 2
      // Guard in-year range 1..2
      const normalized = inYearSem >= 1 && inYearSem <= 2 ? inYearSem : parsedSem
      filter.$or = [{ semester: parsedSem }, { semester: normalized }]
    } else if (parsedSem > 2 && !parsedYear) {
      // If year not provided, infer likely year from global semester
      const inferredYear = Math.ceil(parsedSem / 2)
      const inYearSem = ((parsedSem - 1) % 2) + 1 // 1 for odd, 2 for even
      // Match either records saved as global or in-year with inferred year
      filter.$or = [
        { semester: parsedSem },
        { $and: [{ year: inferredYear }, { semester: inYearSem }] }
      ]
    } else if (parsedSem <= 2 && parsedYear) {
      // In-year semester provided with year: include OR with equivalent global semester
      const globalSem = (parsedYear - 1) * 2 + parsedSem
      filter.$or = [{ semester: parsedSem }, { semester: globalSem }]
    } else {
      // Regular case
      filter.semester = parsedSem
    }
  }

  const subjects = await Subject.find(filter)
    .populate('createdBy', 'username firstName lastName')
    .sort({ year: 1, semester: 1, name: 1 })

  res.status(200).json({
    success: true,
    count: subjects.length,
    data: subjects
  })
})



// @desc    Initialize predefined subjects
// @route   POST /api/subjects/initialize
// @access  Private (Coordinator only)
export const initializePredefinedSubjects = asyncHandler(async (req, res, next) => {
  try {
    // Clear existing subjects first to avoid duplicate key errors
    await Subject.deleteMany({})
    
    const subjectsToCreate = predefinedSubjects.map(subject => ({
      ...subject,
      branches: req.body.branches?.map(b => b.toUpperCase()) || ['CSE'],
      createdBy: req.user.id
    }))

    const createdSubjects = await Subject.insertMany(subjectsToCreate)

    res.status(201).json({
      success: true,
      message: 'Predefined subjects initialized successfully',
      count: createdSubjects.length,
      data: createdSubjects
    })
  } catch (error) {
    return next(new AppError('Error initializing subjects: ' + error.message, 500))
  }
})

// @desc    Create subject
// @route   POST /api/subjects
// @access  Private (Coordinator only)
export const createSubject = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400))
  }

  let { name, code, acronym, branches, creditHours, type, year, semester } = req.body

  // Validation for required fields
  if (!name || !code) {
    return next(new AppError('Name and code are required fields', 400))
  }

  // Auto-apply coordinator's branch if no branches specified
  if (!branches || branches.length === 0) {
    branches = [req.user.branch]
  }
  if (branches && branches.length > 0) {
  branches = branches.map(b => b.toUpperCase())
} else {
  branches = [req.user.branch?.toUpperCase() || 'CSE']
}


  // Safely handle code and acronym with proper validation
  const normalizedCode = String(code).toUpperCase().trim()
  const normalizedAcronym = acronym ? String(acronym).toUpperCase().trim() : normalizedCode

  // Check if subject already exists
  const existingSubject = await Subject.findOne({ 
    code: normalizedCode,
    branches: { $in: branches },
    year,
    semester
  })

  if (existingSubject) {
    return next(new AppError('Subject with this code already exists for selected branch(es), year, and semester', 400))
  }

  const subject = await Subject.create({
    name: String(name).trim(),
    code: normalizedCode,
    acronym: normalizedAcronym,
    branches,
    creditHours: creditHours || 3, // Default credit hours
    type: type || 'theory', // Default type
    year: year || req.user.year, // Use coordinator's year if not specified
    semester: semester || req.user.semester, // Use coordinator's semester if not specified
    createdBy: req.user.id
  })

  res.status(201).json({
    success: true,
    message: 'Subject created successfully',
    data: subject
  })
})

// @desc    Update subject
// @route   PUT /api/subjects/:id
// @access  Private (Coordinator only)
export const updateSubject = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const subject = await Subject.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  )

  if (!subject) {
    return next(new AppError('Subject not found', 404))
  }

  res.status(200).json({
    success: true,
    message: 'Subject updated successfully',
    data: subject
  })
})

// @desc    Delete subject
// @route   DELETE /api/subjects/:id
// @access  Private (Coordinator only)
export const deleteSubject = asyncHandler(async (req, res, next) => {
  const subject = await Subject.findByIdAndDelete(req.params.id)

  if (!subject) {
    return next(new AppError('Subject not found', 404))
  }

  res.status(200).json({
    success: true,
    message: 'Subject deleted successfully'
  })
})