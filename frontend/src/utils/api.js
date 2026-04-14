import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle response errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (name, email, password) => apiClient.post('/auth/signup', { name, email, password }),
  login: (email, password, deviceToken) => apiClient.post('/auth/login', { email, password }, {
    headers: deviceToken ? { 'X-Device-Token': deviceToken } : {}
  }),
  changePassword: (data) => apiClient.put('/auth/change-password', data),
  setupMfa: () => apiClient.get('/auth/mfa/setup'),
  enableMfa: (code) => apiClient.post('/auth/mfa/enable', code, { headers: { 'Content-Type': 'text/plain' } }),
  disableMfa: () => apiClient.post('/auth/mfa/disable'),
  verifyMfa: (data) => apiClient.post('/auth/mfa/verify', data),
};

export const userAPI = {
  getCurrentUser: () => apiClient.get('/users/me'),
  getProfile: () => apiClient.get('/users/profile'),
  updateProfile: (data) => apiClient.put('/users/me', data),
  uploadAvatar: (formData) => apiClient.post('/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const portfolioAPI = {
  getPortfolio: () => apiClient.get('/portfolio'),
  addInvestment: (data) => apiClient.post('/portfolio/add', data),
  getNetWorth: () => apiClient.get('/portfolio/networth'),
  updateInvestment: (id, data) => apiClient.put(`/portfolio/${id}`, data),
  deleteInvestment: (id) => apiClient.delete(`/portfolio/${id}`),
};

export const marketAPI = {
  getPrice: (symbol) => apiClient.get(`/market/price?symbol=${symbol}`),
};

export default apiClient;
