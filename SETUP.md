# 🧰 Project Setup & Deployment Guide

## 📋 Overview

This document provides comprehensive setup and deployment instructions for the Timetable Management System, which follows a **Monolithic MERN Architecture** with the React frontend served by the Express backend in production.

## 🚀 Quick Start

### Prerequisites

- Node.js 18.x
- npm 8.x or later
- MongoDB Atlas account
- Git

### 1. Clone and Install

```bash
git clone https://github.com/ItsNehaOjha/tt_schedular.git
cd tt_schedular
npm install
cd frontend && npm install
cd ../backend && npm install
cd ..
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
# Server
PORT=5001
NODE_ENV=development

# Database
MONGODB_URI=your_mongodb_atlas_connection_string

# Authentication
JWT_SECRET=your_secure_jwt_secret
JWT_EXPIRE=30d

# Frontend (for development)
VITE_API_URL=http://localhost:5001/api
```

### 3. Start Development Servers

```bash
# From project root
npm run dev
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:5001

## �️ Production Deployment

### 1. Build Frontend

```bash
npm run build
```

### 2. Start Production Server

```bash
npm start
```

The application will be available at `http://localhost:5001`

## 🚀 Deployment to Render

1. Create a new **Web Service** on Render
2. Connect your GitHub repository
3. Configure build settings:
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Node Version**: 18.x

### Environment Variables on Render

Add these to your Render dashboard:

```env
NODE_ENV=production
PORT=10000
MONGODB_URI=your_production_mongodb_uri
JWT_SECRET=your_secure_jwt_secret
```

## 🛠️ Common Issues & Solutions

### ❌ Cannot GET /dashboard

**Cause**: Missing SPA fallback in Express.

**Fix**: Ensure your Express app has:

```javascript
app.get('*', (req, res) => {
  res.sendFile(path.resolve(__dirname, '../../frontend/dist/index.html'));
});
```

### ❌ MongoDB Connection Issues

**Cause**: Incorrect connection string or network issues.

**Verify**:
1. MongoDB Atlas IP whitelist
2. Correct connection string format
3. Network connectivity

### ❌ CORS Errors

**Solution**: Ensure your frontend is using the correct API base URL:

```javascript
const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5001/api'
  : '/api';
```

## 🧪 Testing Production Build Locally

1. Build the frontend:
   ```bash
   cd frontend
   npm run build
   ```

2. Start the production server:
   ```bash
   cd ..
   npm start
   ```

3. Verify:
   - Visit http://localhost:5001
   - Test authentication flows
   - Verify PDF generation
   - Check all role-based features

## 🔄 Deployment Checklist

- [ ] All environment variables set
- [ ] Frontend built successfully
- [ ] Database connected
- [ ] Authentication working
- [ ] All features tested
- [ ] Error pages configured
- [ ] Security headers in place

---

*For feature documentation and code organization, refer to the project's [README.md](./README.md).*
