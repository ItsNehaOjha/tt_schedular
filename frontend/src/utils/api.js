import axios from 'axios';

// 🚨 LOCALHOST ONLY IN DEV
const BASE_URL = import.meta.env.DEV
  ? 'http://localhost:5001/api/v1'
  : '/api/v1';

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/coordinator/login';
    }
    return Promise.reject(error);
  }
);

// ================= API =================

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  registerCoordinator: (data) => api.post('/auth/register-coordinator', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
  logout: () => api.post('/auth/logout'),
  updateDetails: (data) => api.put('/auth/updatedetails', data),
  updatePassword: (data) => api.put('/auth/updatepassword', data)
};

export const teacherAPI = {
  getTeachers: () => api.get('/coordinator/teachers'),
  createTeacher: (data) => api.post('/coordinator/create-teacher', data),
  updateTeacher: (id, data) => api.put(`/coordinator/teachers/${id}`, data),
  deleteTeacher: (id) => api.delete(`/coordinator/teachers/${id}`),
  initializeCSE: () => api.post('/coordinator/teachers/initialize')
};

export const subjectAPI = {
  getSubjects: (params = {}) => api.get('/subjects', { params }),
  createSubject: (data) => api.post('/subjects', data),
  updateSubject: (id, data) => api.put(`/subjects/${id}`, data),
  deleteSubject: (id) => api.delete(`/subjects/${id}`),
  initializeSubjects: () => api.post('/subjects/initialize')
};

export const classAPI = {
  getClassOptions: () => api.get('/classes/options'),
  getAllClasses: () => api.get('/classes'),
  getClassById: (id) => api.get(`/classes/${id}`)
};

export const timetableAPI = {
  viewTimetable: (params) => api.get('/timetable/view', { params }),
  getTimetableByBranchSection: (branch, section, year) =>
    api.get(`/timetable/${branch}/${section}`, { params: { year } }),
  getTimetableByClass: (params) =>
    api.get('/timetable/class', { params }),
  getTeacherTimetable: (id) =>
    api.get(`/timetable/teacher/${id}`),
  getTimetables: (params = {}) =>
    api.get('/timetable', { params }),
  createTimetable: (data) =>
    api.post('/timetable', data),
  updateTimetable: (id, data) =>
    api.put(`/timetable/${id}`, data),
  publishTimetable: (id, data) =>
    api.put(`/timetable/${id}/publish`, data),
  deleteTimetable: (id) =>
    api.delete(`/timetable/${id}`),
  getTimetableStats: () =>
    api.get('/timetable/stats'),
  generateSample: (payload) =>
    api.post('/timetable/generate-sample', payload),
  getDraftById: (id) =>
    api.get(`/timetable/draft/${id}`)
};

export default api;
