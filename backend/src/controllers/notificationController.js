import { validationResult } from 'express-validator'
import Notification from '../models/Notification.js'
import { AppError } from '../utils/errorHandler.js'
import { asyncHandler } from '../utils/errorHandler.js'

// @desc    Get notifications
// @route   GET /api/notifications
// @access  Public
export const getNotifications = asyncHandler(async (req, res, next) => {
  const { targetAudience, type, isRead } = req.query
  
  let filter = {}
  if (targetAudience) filter.targetAudience = { $in: [targetAudience, 'all'] }
  if (type) filter.type = type
  if (isRead !== undefined) filter.isRead = isRead === 'true'

  const notifications = await Notification.find(filter)
    .populate('createdBy', 'username firstName lastName')
    .populate('relatedTimetable', 'year branch section')
    .sort({ createdAt: -1 })
    .limit(50)

  res.status(200).json({
    success: true,
    count: notifications.length,
    data: notifications
  })
})

// @desc    Create notification
// @route   POST /api/notifications
// @access  Private (Coordinator only)
export const createNotification = asyncHandler(async (req, res, next) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return next(new AppError(errors.array()[0].msg, 400))
  }

  const { title, message, type, targetAudience, relatedTimetable, priority, expiresAt } = req.body

  const notification = await Notification.create({
    title,
    message,
    type,
    targetAudience,
    relatedTimetable,
    priority,
    expiresAt,
    createdBy: req.user.id
  })

  res.status(201).json({
    success: true,
    message: 'Notification created successfully',
    data: notification
  })
})

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Public
export const markAsRead = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findByIdAndUpdate(
    req.params.id,
    { isRead: true },
    { new: true }
  )

  if (!notification) {
    return next(new AppError('Notification not found', 404))
  }

  res.status(200).json({
    success: true,
    message: 'Notification marked as read',
    data: notification
  })
})

// @desc    Delete notification
// @route   DELETE /api/notifications/:id
// @access  Private (Coordinator only)
export const deleteNotification = asyncHandler(async (req, res, next) => {
  const notification = await Notification.findByIdAndDelete(req.params.id)

  if (!notification) {
    return next(new AppError('Notification not found', 404))
  }

  res.status(200).json({
    success: true,
    message: 'Notification deleted successfully'
  })
})

// Helper function to create timetable notifications
export const createTimetableNotification = async (timetableId, type, createdBy) => {
  try {
    const Timetable = (await import('../models/Timetable.js')).default
    const timetable = await Timetable.findById(timetableId)
    
    if (!timetable) return

    const titles = {
      'timetable_published': 'New Timetable Published',
      'timetable_updated': 'Timetable Updated'
    }

    const messages = {
      'timetable_published': `Timetable for ${timetable.year} ${timetable.branch} Section ${timetable.section} has been published.`,
      'timetable_updated': `Timetable for ${timetable.year} ${timetable.branch} Section ${timetable.section} has been updated.`
    }

    await Notification.create({
      title: titles[type],
      message: messages[type],
      type,
      targetAudience: 'all',
      relatedTimetable: timetableId,
      priority: 'high',
      createdBy
    })
  } catch (error) {
    console.error('Error creating timetable notification:', error)
  }
}