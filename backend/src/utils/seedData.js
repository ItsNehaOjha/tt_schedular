import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import Timetable from '../models/Timetable.js'
import bcrypt from 'bcryptjs'

dotenv.config()

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI)
    console.log('MongoDB Connected for seeding')
  } catch (error) {
    console.error('Database connection error:', error)
    process.exit(1)
  }
}

const seedData = async () => {
  try {
    await connectDB()

    // Clear existing data
    await User.deleteMany({ role: 'coordinator' })
    await Timetable.deleteMany({})

    // Create coordinator user only - no pre-published timetables
    const hashedPassword = await bcrypt.hash('coordinator123', 12)
    const coordinator = await User.create({
      username: 'coordinator',
      email: 'coordinator@college.edu',
      password: hashedPassword,
      firstName: 'System',
      lastName: 'Coordinator',
      role: 'coordinator',
      isActive: true
    })

    console.log('Coordinator created:', coordinator.username)
    console.log('No timetables seeded - system is now fully dynamic!')
    console.log('Coordinators must create and publish timetables for students to see them.')
    
    process.exit(0)

  } catch (error) {
    console.error('Error seeding data:', error)
    process.exit(1)
  }
}

seedData()