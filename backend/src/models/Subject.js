import mongoose from 'mongoose';

const subjectSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, trim: true, uppercase: true },
  acronym: { type: String, required: true, trim: true, uppercase: true },
  type: { type: String, enum: ['theory', 'lab', 'project'], default: 'theory' },
  creditHours: { type: Number, default: 3 },
  year: { type: Number, required: true },
  semester: { type: Number, required: true },
  branches: [{ type: String, enum: ['cse', 'ece', 'eee', 'mech', 'civil', 'it'], default: 'cse' }],
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

// Compound index to prevent duplicate subject codes for same year/semester
subjectSchema.index({ code: 1, year: 1, semester: 1 }, { unique: true });

export default mongoose.model('Subject', subjectSchema);