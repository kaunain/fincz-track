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
    let friendlyMessage = "An unexpected error occurred. Please try again.";
    const errorMessage = error.message || "";
    const errorLower = errorMessage.toLowerCase();
    
    // Get response data content as string for searching, whether it's an object or string
    const responseData = error.response?.data;
    const rawDataContent = typeof responseData === 'object' ? JSON.stringify(responseData) : (responseData || "");
    const dataString = rawDataContent.toLowerCase();

    // Priority Check: Search for connection failures in the message and response body
    if (error.code === 'ERR_NETWORK' || 
        errorLower.includes('connection refused') || 
        errorLower.includes('failed to fetch') ||
        errorLower.includes('finishconnect') ||
        dataString.includes('connection refused') ||
        dataString.includes('finishconnect') ||
        errorMessage === 'Network Error') {

      const fullSearchText = errorMessage + " " + dataString;
      const portMatch = fullSearchText.match(/:(\d{4,5})/);
      const port = portMatch ? portMatch[1] : null;
      
      const serviceMap = {
        '8080': 'Main System',
        '8082': 'User Identity System',
        '8083': 'Portfolio Management System',
        '8084': 'Live Market Feed',
        '8085': 'Alert System'
      };

      const downService = serviceMap[port] || 'System';
      friendlyMessage = `⚠️ Our ${downService} is currently unreachable. This could be due to a temporary network interruption. Please try refreshing the page in a few moments.`;
    } 
    // Fallback for generic network errors
    else if (error.code === 'ERR_NETWORK' || errorLower.includes('failed to fetch') || errorMessage === 'Network Error') {
      friendlyMessage = "Unable to connect to the API Gateway. Please check if the gateway (Port 8080) is running.";
    } else if (error.code === 'ECONNABORTED') {
      friendlyMessage = "The request timed out. Our servers are taking longer than usual to respond.";
    } else if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('auth_token');
      window.location.href = '/login';
      return Promise.reject(error);
    } else if (error.response?.data) {
      if (typeof error.response.data === 'string') {
        friendlyMessage = error.response.data;
      } else {
        friendlyMessage = error.response.data.message || error.response.data.error || friendlyMessage;
      }
    } else if (error.message) {
      friendlyMessage = error.message;
    }

    // Attach the user-friendly message to the error object
    error.userMessage = friendlyMessage;
    
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
  enableMfa: (code) => apiClient.post('/auth/mfa/enable', { code }),
  regenerateRecoveryCodes: () => apiClient.post('/auth/mfa/recovery-codes/regenerate'),
  disableMfa: () => apiClient.post('/auth/mfa/disable'),
  verifyMfa: (data) => apiClient.post('/auth/mfa/verify', data),
  getMfaStatus: () => apiClient.get('/auth/mfa/status'),
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
  getAnalyticsSummary: () => apiClient.get('/portfolio/analytics/summary'),
  bulkAdd: (data) => apiClient.post('/portfolio/bulk', data),
  importPortfolio: (formData) => apiClient.post('/portfolio/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  }),
};

export const marketAPI = {
  getPrice: (symbol) => apiClient.get(`/market/price?symbol=${symbol}`),
};

export default apiClient;
