import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Notification title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  message: {
    type: String,
    required: [true, 'Notification message is required'],
    trim: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters']
  },
  type: {
    type: String,
    enum: ['timetable_published', 'timetable_updated', 'system', 'announcement'],
    default: 'system'
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'teachers', 'coordinators'],
    default: 'all'
  },
  relatedTimetable: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Timetable'
  },
  isRead: {
    type: Boolean,
    default: false
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  expiresAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Index for efficient querying
notificationSchema.index({ targetAudience: 1, createdAt: -1 })
notificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification