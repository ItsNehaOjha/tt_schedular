# Timetable Management System

A complete full-stack web application for managing educational timetables with role-based access control.

## 🚀 Features

### Student Features (No Login Required)
- Select Year → Branch → Section to view timetable
- Modern responsive grid layout
- PDF export functionality
- Auto-refresh when timetables are updated

### Teacher Features (Login Required)
- View personal teaching schedule
- Read-only timetable access
- PDF export of personal schedule

### Coordinator Features (Login Required)
- Complete CRUD operations on timetables
- Manage both student and teacher timetables
- Real-time editing with modal interface
- Publish/unpublish timetables
- Dashboard with statistics

## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js** - Server framework
- **MongoDB** + **Mongoose** - Database and ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **express-validator** - Input validation
- **CORS** - Cross-origin resource sharing
- **Helmet** - Security middleware
- **Rate limiting** - API protection

### Frontend
- **React 18** + **Vite** - UI framework and build tool
- **TailwindCSS** - Styling
- **Framer Motion** - Animations
- **React Router** - Navigation
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **jsPDF** - PDF generation
- **Lucide React** - Icons

## 📁 Project Structure

# React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
