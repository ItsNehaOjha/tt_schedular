import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5001/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Ensure withCredentials is always true
axios.defaults.withCredentials = true;

// Request interceptor - for setting headers, etc.
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - for handling auth redirects
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only handle auth redirects for actual responses (not network errors)
    if (error.response) {
      const status = error.response.status;
      const url = error.config?.url || '';
      const path = window.location?.pathname || '';
      
      const isCoordinatorRequest =
        url.includes('/coordinator') ||
        url.includes('/auth') ||
        path.startsWith('/coordinator');
      
      // Only redirect for auth errors on protected routes
      // Don't redirect for login/register attempts - let component handle those
      if (status === 401 && isCoordinatorRequest && !url.includes('/login')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Use navigate instead of direct location change to prevent page reload
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/coordinator/login';
          return Promise.reject(error);
        }
      }
    }
    
    // For all other errors, just pass them through to be handled by components
    return Promise.reject(error);
  }
)

// Auth API
export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  registerCoordinator: (data) => api.post('/auth/register-coordinator', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data)
}

// Teacher API - Updated to match cleaned backend
export const teacherAPI = {
  getAllTeachers: () => api.get('/teachers/list'),
  getTeacherById: (id) => api.get(`/teachers/${id}`),
  // Coordinator routes for teacher management
  getTeachers: () => api.get('/coordinator/teachers'),
  getAllTeachers: () => api.get('/teachers/list'),
  createTeacher: (data) => api.post('/coordinator/create-teacher', data),
  updateTeacher: (id, data) => api.put(`/coordinator/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/coordinator/teachers/${id}`),
  initializeCSE: () => api.post('/coordinator/teachers/initialize')
}

// Subject API - Updated to match cleaned backend
export const subjectAPI = {
  getSubjects: (params = {}) => api.get('/subjects', { params }),
  // Fallback: try branch/semester path style if needed
  getByBranchSemesterPath: (branch, semester) => api.get(`/subjects/branch/${encodeURIComponent(branch)}/semester/${encodeURIComponent(semester)}`),
  createSubject: (data) => api.post('/subjects', data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  initializeSubjects: () => api.post('/subjects/initialize')
}

// Class API - Updated to match cleaned backend
export const classAPI = {
  getClassOptions: () => api.get('/classes/options'),
  getAllClasses: () => api.get('/classes'),
  getClassById: (id) => api.get(`/classes/${id}`)
}

// Timetable API - Updated to match cleaned backend
export const timetableAPI = {
  viewTimetable: (params) => api.get('/timetable/view', { params }),
  getTimetableByBranchSection: (branch, section, year) => api.get(`/timetable/${branch}/${section}`, { params: { year } }),
  getTimetableByClass: (params) => api.get('/timetable/class', { params }),
  getTeacherTimetable: (id) => api.get(`/timetable/teacher/${id}`),
  getTimetables: (params = {}) => api.get('/timetable', { params }),
  createTimetable: (data) => api.post('/timetable', data),
  updateTimetable: (id, data) => api.put(`/timetable/${id}`, data),
  publishTimetable: (id, data) => api.put(`/timetable/${id}/publish`, data),
  deleteTimetable: (id) => api.delete(`/timetable/${id}`),
  getTimetableStats: () => api.get('/timetable/stats'),
  generateSample: (payload) => api.post('/timetable/generate-sample', payload),
  getDraftById: (id) => api.get(`/timetable/draft/${id}`)
}

export default api