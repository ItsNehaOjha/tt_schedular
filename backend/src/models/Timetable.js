import mongoose from 'mongoose'

const scheduleSlotSchema = new mongoose.Schema({
  day: {
    type: String,
    
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  },
  // add in scheduleSlotSchema:
slotKey: {
  type: String,  // TS1, TS2, LUNCH, ...
  trim: true
},

  timeSlot: {
    type: String,
    
  },
  subject: {
    acronym: {
      type: String,
      
      trim: true
    },
    code: {
      type: String,
      trim: true
    },
    name: {
      type: String,
      trim: true
    }
  },
  teacher: {
    id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    name: {
      type: String,
      
      trim: true
    },
    username: {
      type: String,
      trim: true
    }
  },
  type: {
    type: String,
    enum: ['lecture', 'lab','split-lab', 'lunch', 'free', 'break', 'library', 'mini project', 'mentor'],
    default: 'lecture'
  },
  room: {
    type: String,
    trim: true
  }
})

const timetableSchema = new mongoose.Schema({
  year: {
    type: String,
    required: [true, 'Year is required'],
    enum: ['1st Year', '2nd Year', '3rd Year', '4th Year']
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
    required: true
  },
  publishedVersion: {
  type: Number,
  default: 1
},

revisionHistory: [
  {
    version: Number,
    updatedAt: Date,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  }
],

  schedule: [scheduleSlotSchema],
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  lastModifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
})

// Compound index for unique timetable per year-branch-section
timetableSchema.index(
  { year: 1, branch: 1, section: 1, semester: 1, academicYear: 1 },
  { unique: true }
);



// Index for faster queries
timetableSchema.index({ isPublished: 1 })
timetableSchema.index({ createdBy: 1 })

timetableSchema.index(
  { 'schedule.day': 1, 'schedule.slotKey': 1, 'schedule.teacher.id': 1 }
);

const Timetable = mongoose.model('Timetable', timetableSchema)

export default Timetable