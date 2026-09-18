import axios from 'axios';

const rawUrl = import.meta.env.VITE_API_URL || '';
const API_BASE_URL = rawUrl 
  ? (rawUrl.endsWith('/api') ? rawUrl : `${rawUrl.replace(/\/$/, '')}/api`) 
  : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auto-logout on expired/invalid token
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  me: () => api.get('/auth/me'),
};

export const assessmentAPI = {
  getAll: (params) => api.get('/assessments', { params }),
  getLevels: () => api.get('/assessments/levels'),
  getTaxonomy: () => api.get('/assessments/taxonomy'),
  getById: (id) => api.get(`/assessments/${id}`),
  start: (id, environment) => api.post(`/assessments/${id}/start`, { environment }),
  getResults: () => api.get('/assessments/student/results'),
  // Question sets: create yourself or generate with AI
  create: (data) => api.post('/assessments', data),
  generate: (data) => api.post('/assessments/generate', data, { timeout: 90000 }),
  remove: (id) => api.delete(`/assessments/${id}`),
  getMine: () => api.get('/assessments/mine'),
  getReports: (id) => api.get(`/assessments/${id}/reports`),
  getProctoringReports: (params) => api.get('/assessments/proctoring/reports', { params }),
};

export const attemptAPI = {
  // payload: { answers, events, violationCount, snapshot, faceCount }
  heartbeat: (attemptId, payload) => api.post(`/attempts/${attemptId}/heartbeat`, payload),
  // payload: { answers, proctoring, submitReason, timeTakenSec }
  submit: (attemptId, payload) => api.post(`/attempts/${attemptId}/submit`, payload),
  live: () => api.get('/attempts/live'),
  terminate: (attemptId, reason) => api.post(`/attempts/${attemptId}/terminate`, { reason }),
};

// Used when the page is closing: axios can't send during unload, fetch keepalive can (body must stay < 64 KB).
export const submitAttemptOnUnload = (attemptId, payload) => {
  try {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE_URL}/attempts/${attemptId}/submit`, {
      method: 'POST',
      keepalive: true,
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload),
    });
  } catch (_) {
    // best effort — the server also finalises abandoned attempts
  }
};

export const chatbotAPI = {
  send: (data) => api.post('/chatbot', data),
};

export const academicianAPI = {
  getMentees: () => api.get('/academician/mentees'),
  addFeedback: (data) => api.post('/academician/feedback', data),
  getOpportunities: () => api.get('/academician/opportunities'),
  addOpportunity: (data) => api.post('/academician/opportunities', data),
};

export const opportunityAPI = {
  getAll: (params) => api.get('/opportunities', { params }),
  getRecommended: () => api.get('/opportunities/recommended'),
  getById: (id) => api.get(`/opportunities/${id}`),
  create: (data) => api.post('/opportunities', data),
  delete: (id) => api.delete(`/opportunities/${id}`),
};

export const applicationAPI = {
  getAll: () => api.get('/applications'),
  create: (data) => api.post('/applications', data),
  updateStatus: (id, status) => api.put(`/applications/${id}/status`, { status }),
};

export const profileAPI = {
  getStudentProfile: (id) => api.get(`/profiles/student/${id}`),
  getMyProfile: () => api.get('/profiles/student/me'),
  updateMyProfile: (data) => api.put('/profiles/my-profile', data), // BUG: was pointing to wrong endpoint
  searchProfiles: (role, query) => api.get('/profiles/search', { params: { role, query } }), // BUG-002: was missing
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
  markAllAsRead: () => api.put('/notifications/read-all'),
  broadcast: (data) => api.post('/notifications/broadcast', data),
};

export default api;
