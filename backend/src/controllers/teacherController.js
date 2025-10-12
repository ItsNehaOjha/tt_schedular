// backend/src/controllers/teacherController.js
import mongoose from 'mongoose'
import User from '../models/User.js' // <- adjust path if your model file name/path differs

// Helper: check ObjectId validity
function isValidObjectId(id) {
  if (!id) return false
  return mongoose.Types.ObjectId.isValid(String(id))
}

/**
 * GET /api/teachers/list
 * Optional query:
 *   - branch= CSE | all
 *   - isActive= true|false
 *   - search= text (search name / teacherId / department)
 */

export const listTeachers = async (req, res) => {
  try {
    const { branch, isActive, search } = req.query
    const filter = {}

    // branch: treat "all" as no filter
    if (branch && branch !== 'all') {
      // Some projects use `department` or `branch` on user model — adjust if necessary
      filter.department = branch
    }

    if (typeof isActive !== 'undefined') {
      filter.isActive = isActive === 'true' || isActive === true
    }

    if (search) {
      const q = String(search).trim()
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { displayName: regex },
        { username: regex },
        { teacherId: regex },
        { department: regex }
      ]
    }

    const teachers = await User.find(filter)
      .select('_id displayName teacherId department isActive username firstName lastName')
      .sort({ displayName: 1 })
      .lean()

    const data = teachers.map((t) => ({
      id: t._id?.toString?.() ?? t._id,
      name: t.displayName || `${t.firstName || ''} ${t.lastName || ''}`.trim(),
      teacherId: t.teacherId || '',
      department: t.department || '',
      isActive: typeof t.isActive === 'boolean' ? t.isActive : true,
      username: t.username || ''
    }))

    return res.json({ success: true, count: data.length, data })
  } catch (err) {
    console.error('listTeachers error:', err)
    return res.status(500).json({ success: false, message: 'Failed to load teachers', error: err.message })
  }
}

/**
 * GET /api/teachers/grouped
 * Returns teachers grouped by department (useful for a sidebar)
 */
export const listTeachersGrouped = async (req, res) => {
  try {
    // Optionally accept isActive and search filters
    const { isActive, search } = req.query
    const filter = {}
    if (typeof isActive !== 'undefined') filter.isActive = isActive === 'true' || isActive === true
    if (search) {
      const q = String(search).trim()
      const regex = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { displayName: regex },
        { username: regex },
        { teacherId: regex },
        { department: regex }
      ]
    }

    const teachers = await User.find(filter)
      .select('_id displayName teacherId department isActive username firstName lastName')
      .sort({ department: 1, displayName: 1 })
      .lean()

    // group by department (use 'General' for missing departments)
    const grouped = teachers.reduce((acc, t) => {
      const dept = (t.department || 'General')
      if (!acc[dept]) acc[dept] = []
      acc[dept].push({
        id: t._id?.toString?.() ?? t._id,
        name: t.displayName || `${t.firstName || ''} ${t.lastName || ''}`.trim(),
        teacherId: t.teacherId || '',
        isActive: typeof t.isActive === 'boolean' ? t.isActive : true,
        username: t.username || ''
      })
      return acc
    }, {})

    // Turn into array for predictable ordering: [{ department, teachers: [...] }, ...]
    const result = Object.keys(grouped).sort().map(dept => ({ department: dept, teachers: grouped[dept] }))

    return res.json({ success: true, count: teachers.length, data: result })
  } catch (err) {
    console.error('listTeachersGrouped error:', err)
    return res.status(500).json({ success: false, message: 'Failed to load grouped teachers', error: err.message })
  }
}

export const getTeacherById = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'Missing teacher id' })
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid teacher id' })

    const teacher = await User.findById(id).lean()
    if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' })

    return res.json({ success: true, data: teacher })
  } catch (err) {
    console.error('getTeacherById error:', err)
    return res.status(500).json({ success: false, message: 'Server error', error: err.message })
  }
}

/**
 * POST /api/teachers
 */
export const createTeacher = async (req, res) => {
  try {
    const payload = req.body || {}
    // minimal validation
    if (!payload.firstName && !payload.displayName) {
      return res.status(400).json({ success: false, message: 'Teacher name required' })
    }

    const newTeacher = await User.create(payload)
    return res.status(201).json({ success: true, data: newTeacher })
  } catch (err) {
    console.error('createTeacher error:', err)
    return res.status(500).json({ success: false, message: 'Failed to create teacher', error: err.message })
  }
}

/**
 * PUT /api/teachers/:id
 */
export const updateTeacher = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'Missing teacher id' })
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid teacher id' })

    const updated = await User.findByIdAndUpdate(id, req.body || {}, { new: true, runValidators: true }).lean()
    if (!updated) return res.status(404).json({ success: false, message: 'Teacher not found' })

    return res.json({ success: true, data: updated })
  } catch (err) {
    console.error('updateTeacher error:', err)
    return res.status(500).json({ success: false, message: 'Failed to update teacher', error: err.message })
  }
}

/**
 * DELETE /api/teachers/:id
 */
export const deleteTeacher = async (req, res) => {
  try {
    const { id } = req.params
    if (!id) return res.status(400).json({ success: false, message: 'Missing teacher id' })
    if (!isValidObjectId(id)) return res.status(400).json({ success: false, message: 'Invalid teacher id' })

    const deleted = await User.findByIdAndDelete(id).lean()
    if (!deleted) return res.status(404).json({ success: false, message: 'Teacher not found' })

    return res.json({ success: true, message: 'Teacher deleted' })
  } catch (err) {
    console.error('deleteTeacher error:', err)
    return res.status(500).json({ success: false, message: 'Failed to delete teacher', error: err.message })
  }
}
