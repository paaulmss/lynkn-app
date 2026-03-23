import api from '../api/axiosConfig';

export const authService = {
  /**
   * 1. REGISTRO MANUAL
   * Envía los datos (incluyendo fotos en Base64) al backend.
   */
  register: async (userData: any) => {
    const response = await api.post('/auth/register', userData);
    
    // Si el registro devuelve token (porque logueamos al usuario de una vez)
    if (response.data.access_token) {
      localStorage.setItem('lynkn_token', response.data.access_token);
      localStorage.setItem('lynkn_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * 2. LOGIN MANUAL
   * Autenticación con email y password.
   */
  loginManual: async (credentials: { email: string; password: any }) => {
    const response = await api.post('/auth/login', credentials);
    
    if (response.data.access_token) {
      localStorage.setItem('lynkn_token', response.data.access_token);
      localStorage.setItem('lynkn_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * 3. LOGIN CON GOOGLE
   */
  loginWithGoogle: async (googleToken: string) => {
    const response = await api.post('/auth/google', { token: googleToken });
    
    if (response.data.access_token) {
      localStorage.setItem('lynkn_token', response.data.access_token);
      localStorage.setItem('lynkn_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  /**
   * 4. LOGOUT
   */
  logout: () => {
    localStorage.removeItem('lynkn_token');
    localStorage.removeItem('lynkn_user');
  }
};