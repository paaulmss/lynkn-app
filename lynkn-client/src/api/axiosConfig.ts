import axios from 'axios';

/**
 * Configuración de la instancia base de Axios
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:4000',
  headers: {
    'Content-Type': 'application/json',
  },
});

/**
 * Interceptor de peticiones para la gestión de tokens de autenticación
 */
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  return config;
}, (error) => {
  // Gestión de errores en la configuración de la petición
  return Promise.reject(error);
});

export default api;