import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_BASE_URL ||
  (import.meta.env.PROD ? 'https://edu-sphere-i3xv.onrender.com' : 'http://localhost:8009');

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const isAuthRoute = config.url && /^\/api\/auth\/(login|register)/.test(config.url);
  const token = localStorage.getItem('token');
  if (token && !isAuthRoute) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || '';
    const isAuthRoute = /^\/api\/auth\/(login|register)/.test(url);
    const isMeRoute = /^\/api\/auth\/me/.test(url);

    if (error.response?.status === 401 && !isAuthRoute) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Dispatch custom event so AuthProvider can react without hard page reload
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));

      // If user was on a protected page (not login or register), navigate to login
      const path = window.location.pathname;
      if (!path.startsWith('/login') && !path.startsWith('/register') && !isMeRoute) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const errMsg = (e) => {
  if (!e) return 'An unknown error occurred.';
  if (e.response?.data?.message) return e.response.data.message;
  if (e.response?.status === 403) return 'You do not have permission to perform this action.';
  if (e.response?.status === 404) return 'The requested resource was not found.';
  if (e.request && !e.response) {
    return `Cannot reach the backend server at ${API_BASE}. Please ensure the Spring Boot application is running.`;
  }
  return e.message || 'An unexpected error occurred.';
};

export default api;
