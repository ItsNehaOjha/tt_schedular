# Timetable Management System

[![Live Demo](https://img.shields.io/badge/Live%20Demo-tt--schedular.onrender.com-brightgreen)](https://tt-schedular.onrender.com/)
[![GitHub](https://img.shields.io/badge/GitHub-Repository-blue)](https://github.com/ItsNehaOjha/tt_schedular)

A full-stack Timetable Management System designed to streamline academic scheduling in educational institutions using a **role-based access model**.

## 🚀 Features

### 🎓 Student Features
- View timetables by Year → Branch → Section
- Responsive grid-based timetable layout
- Download timetable as PDF
- Auto-refresh on updates

### 👨‍🏫 Teacher Features
- View personal teaching schedule
- Read-only access to relevant timetables

### 🧑‍💼 Coordinator Features
- Full CRUD operations for timetables
- Manage teachers, subjects, and classes
- Publish/unpublish timetables
- Real-time editing interface
- Dashboard with statistics

🔐 Demo Access (For Evaluation Only)

A pre-seeded demonstration coordinator account is available to explore the system features without manual setup:

Coordinator ID: 032026
Password: 111111


⚠️ This account has limited privileges and is intended solely for testing the deployed application interface.


## 🛠 Tech Stack

### Backend
- **Node.js** + **Express.js**
- **MongoDB Atlas** + **Mongoose**
- **JWT Authentication**
- **bcryptjs** for password hashing
- **Helmet** for security headers
- **Rate Limiting** for API protection

### Frontend
- **React 18** + **Vite**
- **TailwindCSS** for styling
- **React Router** for navigation
- **React Query** for data fetching
- **Framer Motion** for animations
- **jsPDF** for client-side PDF generation
- **Lucide React** for icons

## 📦 Quick Start

1. Clone the repository
   ```bash
   git clone https://github.com/ItsNehaOjha/tt_schedular.git
   cd tt_schedular
   ```

2. Install dependencies
   ```bash
   npm install
   cd frontend && npm install
   cd ../backend && npm install
   cd ..
   ```

3. Set up environment variables (see [SETUP.md](./SETUP.md))

4. Start development servers
   ```bash
   # In root directory
   npm run dev
   ```

For detailed setup and deployment instructions, see [SETUP.md](./SETUP.md).

## 🔐 Authentication & Roles

| Role        | Login Required | Permissions                 |
|-------------|----------------|-----------------------------|
| Student     | ❌ No          | View & export timetable     |
| Teacher     | ✅ Yes         | View personal schedule      |
| Coordinator | ✅ Yes         | Full CRUD + publish control |

## 🛡 Security Highlights

- JWT-based authentication
- Role-based access control
- Input validation and sanitization
- Rate limiting on API endpoints
- Secure HTTP headers
- CSRF protection
- Secure CORS configuration

## 🧠 Design Decisions

* **No student login** → Frictionless timetable access
* **Role-based middleware** → Clean authorization logic
* **Draft + publish flow** → Prevents accidental exposure
* **Client-side PDF export** → Reduced backend load
* **Monolithic MERN architecture** → Simplified deployment and same-origin API communication

## 📌 Limitations

* Real-time updates require manual refresh (WebSocket support planned)
* Mobile app not implemented yet
* No public API for external integrations

## 🔮 Future Improvements

* WebSocket-based live timetable updates
* Mobile-first UI & PWA support
* Redis caching for faster reads
* Audit logs for timetable changes
* Admin analytics dashboard
* Multi-institution support

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch
3. Commit your changes with clear messages
4. Push to the branch
5. Open a pull request

## 📄 License

Licensed under the **MIT License**.

## 👩‍💻 Author

**Neha Ojha**

- GitHub: [@ItsNehaOjha](https://github.com/ItsNehaOjha)
- LinkedIn: [neha-ojha0028](https://linkedin.com/in/neha-ojha0028)

---

*For detailed setup, deployment, and troubleshooting, please refer to [SETUP.md](./SETUP.md).*
