import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const assessmentAPI = {
  getAll: () => api.get('/assessments'),
  getById: (id) => api.get(`/assessments/${id}`),
  submit: (id, answers) => api.post(`/assessments/${id}/submit`, { answers }),
  getResults: () => api.get('/assessments/student/results'),
};

export const opportunityAPI = {
  getAll: (params) => api.get('/opportunities', { params }),
  getRecommended: () => api.get('/opportunities/recommended'),
  getById: (id) => api.get(`/opportunities/${id}`),
  create: (data) => api.post('/opportunities', data),
};

export const applicationAPI = {
  getAll: () => api.get('/applications'),
  create: (data) => api.post('/applications', data),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
};

export const profileAPI = {
  getStudentProfile: (userId) => api.get(`/profiles/student/${userId}`),
  getMyProfile: () => api.get('/profiles/student/me'),
  updateStudentProfile: (data) => api.put('/profiles/student', data),
  addCertificate: (data) => api.post('/profiles/certificates', data),
  deleteCertificate: (id) => api.delete(`/profiles/certificates/${id}`),
  addProject: (data) => api.post('/profiles/projects', data),
  deleteProject: (id) => api.delete(`/profiles/projects/${id}`),
  getResumeData: () => api.get('/profiles/student/resume-data'),
};

export const badgeAPI = {
  getAll: () => api.get('/badges'),
  checkAndAward: () => api.post('/badges/check-and-award'),
};

export const skillProfileAPI = {
  get: () => api.get('/skill-profile'),
  getGapAnalysis: () => api.get('/skill-profile/gap-analysis'),
};

export const adminAPI = {
  getUsers: (params) => api.get('/admin/users', { params }),
  updateUserStatus: (id, isActive) => api.put(`/admin/users/${id}/status`, { isActive }),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/role`, { role }),
};

export const analyticsAPI = {
  getDashboard: () => api.get('/analytics/dashboard'),
};

export const notificationAPI = {
  getAll: () => api.get('/notifications'),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
};

export default api;
