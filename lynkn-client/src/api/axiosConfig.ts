import axios from 'axios';
import { Capacitor } from '@capacitor/core';

export const API_BASE_URL = Capacitor.isNativePlatform()
  ? import.meta.env.VITE_MOBILE_API_URL || 'https://lynkn-backend.onrender.com'
  : import.meta.env.VITE_API_URL || 'http://localhost:4000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('lynkn_token'); 
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log("Token enviado correctamente desde lynkn_token");
  } else {
    console.warn("No se encontró lynkn_token en LocalStorage");
  }
  
  return config;
}, (error) => {
  return Promise.reject(error);
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.error("Sesión inválida. Borrando lynkn_token...");
      localStorage.removeItem('lynkn_token');
      localStorage.removeItem('lynkn_user');
    }
    return Promise.reject(error);
  }
);

export default api;
