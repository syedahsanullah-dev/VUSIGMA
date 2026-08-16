import axios from 'axios';
import useAuthStore from '@/store/useAuthStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach Authorization token header automatically if present
api.interceptors.request.use((config) => {
  try {
    if (typeof window !== 'undefined') {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const userObj = JSON.parse(userStr);
        const token = userObj?.token || userObj?.accessToken;
        if (token && !config.headers.Authorization) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
    }
  } catch (e) {
    // Ignore JSON parse errors
  }
  return config;
});

// Handle responses and unauthorized errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'API request failed';
    const requestUrl = error.config?.url || '';
    const isAuthEndpoint = requestUrl.endsWith('/auth') || requestUrl.includes('/auth');

    // Only redirect on 401 for non-login endpoints (session expiration)
    if (error.response?.status === 401 && typeof window !== 'undefined' && !isAuthEndpoint) {
      const { logout } = useAuthStore.getState();
      logout();
      const isAdminRoute = window.location.pathname.startsWith('/admin');
      window.location.href = isAdminRoute ? '/admin/login' : '/login';
    }
    return Promise.reject(new Error(message));
  }
);

export default api;
