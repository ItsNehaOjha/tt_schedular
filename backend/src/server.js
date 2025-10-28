import app from './app.js'
import connectDB from './config/db.js'
import dotenv from 'dotenv'

// Load env vars
dotenv.config()

// Connect to database
connectDB()

const DEFAULT_PORT = process.env.PORT || 5001;
const server = app.listen(DEFAULT_PORT, () => {
  console.log(`Server running on port ${DEFAULT_PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.warn(`Port ${DEFAULT_PORT} is busy, trying another port...`);
    const newPort = Number(DEFAULT_PORT) + 1;
    app.listen(newPort, () => console.log(`Server switched to port ${newPort}`));
  } else {
    console.error('Server error:', err);
  }
});


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