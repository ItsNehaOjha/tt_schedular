import app from './app.js'
import connectDB from './config/db.js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config()

// Connect to database
connectDB()

const PORT = process.env.PORT || 5000

const server = app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`)
})

// Handle unhandled promise rejections
process.on('unhandledRejection', (err, promise) => {
  console.log(`Error: ${err.message}`)
  // Close server & exit process
  server.close(() => {
    process.exit(1)
  })
})

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.log(`Error: ${err.message}`)
  console.log('Shutting down due to uncaught exception')
  process.exit(1)
})