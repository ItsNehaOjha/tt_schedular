import mongoose from 'mongoose'

const classSectionSchema = new mongoose.Schema({
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1', '2', '3', '4']
  },
  branch: {
    type: String,
    required: [true, 'Branch is required'],
    enum: ['CSE', 'CS', 'Biotechnology', 'CE', 'IT', 'EC', 'EE', 'ME', 'MBA', 'MCA']

  },
  section: {
    type: String,
    required: [true, 'Section is required'],
    enum: ['A', 'B', 'C', 'D']
  },
  semester: {
    type: Number,
    required: true,
    min: 1,
    max: 8
  },
  academicYear: {
    type: String,
    required: [true, 'Academic year is required']
  },
  totalStudents: {
    type: Number,
    default: 0,
    min: 0
  },
  classTeacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

// Compound index for unique class
classSectionSchema.index({ year: 1, branch: 1, section: 1, academicYear: 1 }, { unique: true })

const ClassSection = mongoose.model('ClassSection', classSectionSchema)

export default ClassSection