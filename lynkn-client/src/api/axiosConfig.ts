import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const SESSION_EXPIRED_EVENT = 'lynkn:session-expired';
export const API_BASE_URL = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_MOBILE_API_URL || 'https://lynkn-backend.onrender.com'
  : import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:4000' : 'https://lynkn-backend.onrender.com');

const api = axios.create({ baseURL: API_BASE_URL, timeout: 30000 });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lynkn_token');
  if (token) config.headers.Authorization = 'Bearer ' + token;
  return config;
});
api.interceptors.response.use((response) => response, (error: unknown) => {
  if (axios.isAxiosError(error) && error.response?.status === 401) {
    const authorization = error.config?.headers?.Authorization;
    const current = localStorage.getItem('lynkn_token');
    // An old request must not clear a newer login.
    if (current && authorization === 'Bearer ' + current) {
      localStorage.removeItem('lynkn_token');
      localStorage.removeItem('lynkn_user');
      window.dispatchEvent(new Event(SESSION_EXPIRED_EVENT));
    }
  }
  return Promise.reject(error);
});
export default api;
