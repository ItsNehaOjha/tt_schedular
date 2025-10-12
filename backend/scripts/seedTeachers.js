import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../src/models/User.js';

dotenv.config();

// MongoDB connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB Connected (Seeding Teachers)');
  } catch (error) {
    console.error('❌ MongoDB Connection Error:', error);
    process.exit(1);
  }
};

// Split full name into firstName/lastName
const splitName = (fullName) => {
  const parts = fullName.trim().split(' ');
  return {
    firstName: parts[0] || '',
    lastName: parts.length > 1 ? parts.slice(1).join(' ') : ''
  };
};

const seedTeachers = async () => {
  await connectDB();

  try {
    // Load teachers JSON
    const teachersPath = path.join(process.cwd(), 'seeds', 'teachers.seed.json');
    const rawData = fs.readFileSync(teachersPath);
    const teachers = JSON.parse(rawData);

    console.log(`🧾 Found ${teachers.length} teachers in JSON...`);

    for (const t of teachers) {
      const { firstName, lastName } = splitName(t.name);
      const normalizedName = `${(firstName + ' ' + lastName).trim().toLowerCase()}`;

      // Check if teacher already exists (by normalizedName)
      const existing = await User.findOne({
        normalizedName,
        department: t.department,
        role: 'teacher'
      });

      if (existing) {
        console.log(`⚠️ Skipped (Duplicate): ${t.name} [${t.department}]`);
        continue;
      }

      // Create new teacher
      await User.create({
        role: 'teacher',
        firstName,
        lastName,
        department: t.department
      });

      console.log(`✅ Inserted: ${t.name} (${t.department})`);
    }

    console.log('🎉 Teacher Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during Teacher Seeding:', error);
    process.exit(1);
  }
};

// Run seed
seedTeachers();
