import axios from 'axios';

const API = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('ttm_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Handle 401 globally — redirect to login
API.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('ttm_token');
      localStorage.removeItem('ttm_user');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  }
);

// ─── Auth ──────────────────────────────────────────────────────────────────
export const authAPI = {
  signup: (data) => API.post('/auth/signup', data),
  login: (data) => API.post('/auth/login', data),
  getMe: () => API.get('/auth/me'),
};

// ─── Users ─────────────────────────────────────────────────────────────────
export const usersAPI = {
  getAll: () => API.get('/users'),
  getById: (id) => API.get(`/users/${id}`),
  updateProfile: (data) => API.put('/users/profile', data),
  delete: (id) => API.delete(`/users/${id}`),
};

// ─── Projects ──────────────────────────────────────────────────────────────
export const projectsAPI = {
  getAll: () => API.get('/projects'),
  getById: (id) => API.get(`/projects/${id}`),
  create: (data) => API.post('/projects', data),
  update: (id, data) => API.put(`/projects/${id}`, data),
  updateMembers: (id, members) => API.put(`/projects/${id}/members`, { members }),
  delete: (id) => API.delete(`/projects/${id}`),
};

// ─── Tasks ─────────────────────────────────────────────────────────────────
export const tasksAPI = {
  getAll: (params) => API.get('/tasks', { params }),
  getById: (id) => API.get(`/tasks/${id}`),
  getStats: () => API.get('/tasks/stats'),
  create: (data) => API.post('/tasks', data),
  update: (id, data) => API.put(`/tasks/${id}`, data),
  delete: (id) => API.delete(`/tasks/${id}`),
};

export default API;
