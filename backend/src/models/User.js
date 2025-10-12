import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

/**
 * Utility to normalize teacher names (for duplicate detection)
 * Strips titles like Dr., Mr., Ms. and trims properly
 */
function normalizeName(first, last) {
  const raw = `${(first || '').trim()} ${(last || '').trim()}`.toLowerCase();
  return raw
    .replace(/\b(dr\.|mr\.|ms\.|mrs\.|prof\.)\b/g, '') // remove titles
    .replace(/\s+/g, ' ')
    .trim();
}

const userSchema = new mongoose.Schema(
  {
    // ✅ Only required for coordinators
    username: {
  type: String,
  trim: true,
  required: function() {
    return this.role === 'coordinator';
  },
  sparse: true
},


    // ✅ Only required for coordinators
    password: {
      type: String,
      required: function() {
        return this.role === 'coordinator';
      }
    },

    role: {
      type: String,
      enum: ['teacher', 'coordinator'],
      required: true
    },

    // ==================================================
    // 🟦 COORDINATOR FIELDS (login users)
    // ==================================================
    cname: {
      type: String,
      trim: true
    },
    branch: {
      type: String,
      required: function() {
        return this.role === 'coordinator';
      }
    },
    year: {
      type: Number,
      required: function() {
        return this.role === 'coordinator';
      }
    },

    // ==================================================
    // 🟨 TEACHER FIELDS (no-login)
    // ==================================================
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

    // 📌 Auto-generated unique ID for Teachers
    teacherId: {
      type: String,
      unique: true,
      sparse: true // allow null for coordinators
    },

    // 📌 Used internally to avoid teacher duplicates
    normalizedName: {
      type: String,
      index: true,
      sparse: true
    },

    // Who created this teacher (Coordinator reference)
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },

    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

/**
 * 🔁 PRE-SAVE HOOK
 * - Auto generates teacherId
 * - Auto normalizes teacher name
 * - Hashes password only if coordinator
 */
userSchema.pre('save', async function(next) {
  // === TEACHER HANDLING (no username/password required) ===
  if (this.role === 'teacher') {
    // Normalize teacher name
    this.normalizedName = normalizeName(this.firstName, this.lastName);

    // Auto-generate teacherId if missing
    if (!this.teacherId) {
      const deptCode = (this.department || 'GEN')
        .toUpperCase()
        .replace(/[^A-Z]/g, '')
        .slice(0, 6);

      const count = await this.constructor.countDocuments({
        role: 'teacher',
        department: this.department
      });

      this.teacherId = `IMSEC-${deptCode}-${String(count + 1).padStart(3, '0')}`;
    }

    // Teachers do not need username or password
    if (!this.password) this.password = undefined;
    if (!this.username) this.username = undefined;
  }

  // === COORDINATOR PASSWORD HASHING ===
  if (this.role === 'coordinator' && this.isModified('password')) {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
  }

  next();
});

// 🛡 Password comparison method (only for coordinators)
userSchema.methods.matchPassword = async function(enteredPassword) {
  if (!this.password) return false;
  return await bcrypt.compare(enteredPassword, this.password);
};

// 🧾 Virtual: displayName
userSchema.virtual('displayName').get(function() {
  if (this.role === 'coordinator') {
    return this.cname;
  }
  return this.firstName && this.lastName
    ? `${this.firstName} ${this.lastName}`
    : this.firstName || 'Unknown';
});

// 🧾 Virtual: fullName
userSchema.virtual('fullName').get(function() {
  return this.displayName;
});

const User = mongoose.model('User', userSchema);
export default User;
