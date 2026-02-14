import path from 'path';
import { fileURLToPath } from 'url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';
import xss from 'xss-clean';
import hpp from 'hpp';
import cookieParser from 'cookie-parser';
import compression from 'compression';

// Route imports
import authRoutes from "./routes/authRoutes.js";
import subjectRoutes from "./routes/subjectRoutes.js";
import classRoutes from "./routes/classRoutes.js";
import timetableRoutes from "./routes/timetableRoutes.js";
import teacherRoutes from "./routes/teacherRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import coordinatorRoutes from "./routes/coordinatorRoutes.js";

// Middleware imports
import { globalErrorHandler } from "./utils/errorHandler.js";

const app = express();

// ES MODULE __dirname FIX (MANDATORY FOR RENDER)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. GLOBAL MIDDLEWARES
// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Enable CORS with production/development configuration
const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? new RegExp(process.env.FRONTEND_URL || '^https?://(?:[^.]+\.)?yourdomain\.com$')
    : ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};
app.use(cors(corsOptions));

app.use(cookieParser());

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // limit each IP to 200 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api', apiLimiter);

// Body parser, reading data from body into req.body
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp({
  whitelist: [
    'duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price'
  ]
}));

// Compress all responses
app.use(compression());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

// HEALTH CHECK
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "success",
    message: "Server is running",
    timestamp: new Date().toISOString(),
  });
});

// ================= API ROUTES =================
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/subjects', subjectRoutes);
app.use('/api/v1/classes', classRoutes);
app.use('/api/v1/timetable', timetableRoutes);
app.use('/api/v1/teachers', teacherRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/coordinator', coordinatorRoutes);

// ================= STATIC FILES =================
const staticOptions = {
  maxAge: '1y',
  lastModified: true,
  etag: true,
  setHeaders: (res, path) => {
    if (path.endsWith('.html')) {
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
    }
  }
};

// Serve static files from React app
const staticPath = path.join(__dirname, '../../frontend/dist');
app.use(express.static(staticPath, staticOptions));

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(path.join(staticPath, 'index.html'), {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    }
  });
});

// ================= ERROR HANDLER =================
// Handle 404 - Must be after all other routes
app.use((req, res) => {
  res.status(404).json({
    status: 'fail',
    message: `Can't find ${req.originalUrl} on this server!`
  });
});

// Global error handling middleware
app.use(globalErrorHandler);

export default app;
