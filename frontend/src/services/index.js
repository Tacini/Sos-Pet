import api from './api';

// ── Auth ──────────────────────────────────────────────────────────────────────
export const authService = {
  register: (data) => api.post('/auth/register', data),
  login:    (data) => api.post('/auth/login', data),
  me:       ()     => api.get('/auth/me'),
};

// ── Feed & Search ─────────────────────────────────────────────────────────────
export const searchService = {
  feed:   ()       => api.get('/search/feed'),
  search: (params) => api.get('/search', { params }),
};

// ── Quick Reports ─────────────────────────────────────────────────────────────
export const reportService = {
  create: (formData) =>
    api.post('/reports/quick', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list:    (params) => api.get('/reports/quick', { params }),
  getById: (id)     => api.get(`/reports/quick/${id}`),
};

// ── Lost Pets ─────────────────────────────────────────────────────────────────
export const petService = {
  create: (formData) =>
    api.post('/pets/lost', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  list:         (params) => api.get('/pets/lost', { params }),
  getById:      (id)     => api.get(`/pets/lost/${id}`),
  myPets:       ()       => api.get('/pets/my'),
  updateStatus: (id, status) => api.patch(`/pets/lost/${id}/status`, { status }),
};
