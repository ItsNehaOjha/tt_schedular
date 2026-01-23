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

## 📂 Project Structure (High-Level)

```bash
backend/
  src/
    app.js
    server.js
    config/
    controllers/
    middleware/
    models/
    routes/
    utils/

frontend/
  src/
    components/
    pages/
    hooks/
    utils/
    styles/
```

* **backend/** → REST APIs, auth, business rules, DB logic
* **frontend/** → React UI, timetable views, PDF export

---

## ⚙️ Environment Setup

### Backend (`backend/.env`)

```env
PORT=5000
MONGO_URI=your_mongodb_atlas_uri
JWT_SECRET=your_long_secure_secret
NODE_ENV=development
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:5000/api
```

⚠️ **Important:** Always include `/api` in `VITE_API_URL`.

---

## ▶️ Getting Started (Local Setup)

### 1️⃣ Clone the repository

```bash
git clone https://github.com/your-username/timetable-management-system.git
cd timetable-management-system
```

### 2️⃣ Install dependencies

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

### 3️⃣ Run the application

```bash
# Start backend
cd backend
npm run dev

# Start frontend
cd ../frontend
npm run dev
```

* Backend runs on: `http://localhost:5000`
* Frontend runs on: `http://localhost:5173`

---

## 🔐 Authentication & Roles

| Role        | Login Required | Permissions                 |
| ----------- | -------------- | --------------------------- |
| Student     | ❌ No           | View & export timetable     |
| Teacher     | ✅ Yes          | View personal schedule      |
| Coordinator | ✅ Yes          | Full CRUD + publish control |

Authentication uses **JWT tokens** with role-based route protection.

---

## 📄 PDF Export

* Students and teachers can export timetables as PDF
* Client-side PDF generation using **jsPDF**
* No server-side rendering required

---

## 🛡 Security Highlights

* JWT authentication & role-based authorization
* Input validation using `express-validator`
* API protection via rate limiting
* XSS & NoSQL injection prevention
* Secure CORS configuration

---

## 🧠 Design Decisions

* **No student login** → frictionless access
* **Role-based middleware** → clean authorization logic
* **Draft + publish flow** → prevents accidental timetable exposure
* **Compound DB indexes** → avoids duplicate timetables
* **Client-side PDF export** → reduced backend load

---

## 📌 Limitations

* Real-time updates require manual refresh (WebSocket support planned)
* Mobile app not implemented yet
* No public API for external integrations

---

## 🔮 Future Improvements

* WebSocket-based live timetable updates
* Mobile-first UI & PWA support
* Redis caching for faster reads
* Audit logs for timetable changes
* Admin analytics dashboard
* Multi-institution support

---

## 🤝 Contribution Guidelines

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes with clear messages
4. Open a pull request

---

## 📄 License

This project is licensed under the **MIT License**.
You are free to use, modify, and distribute it.

---

## 👩‍💻 Author

**Neha Ojha**

* GitHub: [https://github.com/ItsNehaOjha](https://github.com/ItsNehaOjha)
* LinkedIn: [https://linkedin.com/in/neha-ojha0028](https://linkedin.com/in/neha-ojha0028)

---

## ⭐ Final Note

This project was built to solve **real institutional scheduling problems**,
focusing on **clean architecture**, **security**, and **practical usability**.

If you’re a recruiter or developer reviewing this repo:
👉 **Start with `backend/src/app.js` to understand the request lifecycle.**

---
