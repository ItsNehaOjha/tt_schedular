import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  cname: {
    type: String,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['teacher', 'coordinator'],
    required: true
  },
  // Coordinator specific fields
  branch: {
    type: String,
    required: function() { return this.role === 'coordinator' }
  },
  year: {
    type: Number,
    required: function() { return this.role === 'coordinator' }
  },
  // Teacher specific fields
  firstName: {
    type: String,
    trim: true
  },
  lastName: {
    type: String,
    trim: true
  },
  department: {
    type: String,
    trim: true
  },
  designation: {
    type: String,
    trim: true
  },
  specialization: {
    type: [String],
    default: []
  },
  experience: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
})

// Encrypt password using bcrypt
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) {
    next()
  }

  const salt = await bcrypt.genSalt(10)
  this.password = await bcrypt.hash(this.password, salt)
})

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

// Get display name
userSchema.virtual('displayName').get(function() {
  if (this.role === 'coordinator') {
    return this.cname
  }
  return this.firstName && this.lastName ? `${this.firstName} ${this.lastName}` : this.username
})

// Get full name (for backward compatibility)
userSchema.virtual('fullName').get(function() {
  if (this.firstName && this.lastName) {
    return `${this.firstName} ${this.lastName}`
  }
  return this.cname || this.username
})

const User = mongoose.model('User', userSchema)

export default User