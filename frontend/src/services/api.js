import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Auth endpoints
export const auth = {
  getStatus: () => api.get('/auth/status'),
  logout: () => api.post('/auth/logout'),
  googleAuth: () => {
    window.location.href = '/api/auth/google';
  }
};

// Mockups endpoints
export const mockups = {
  list: (folderId) => api.get('/mockups', { params: { folderId } }),
  getById: (fileId) => api.get(`/mockups/${fileId}`)
};

// Listings endpoints
export const listings = {
  generate: (data) => api.post('/listings/generate', data),
  create: (data) => api.post('/listings/create', data),
  list: () => api.get('/listings'),
  getById: (id) => api.get(`/listings/${id}`)
};

// Templates endpoints
export const templates = {
  list: () => api.get('/templates'),
  create: (data) => api.post('/templates', data),
  update: (id, data) => api.put(`/templates/${id}`, data),
  delete: (id) => api.delete(`/templates/${id}`)
};

export default api;
