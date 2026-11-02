import api from '../api/axiosConfig';
import type { User } from '../types';

export interface RegisterData {
  username: string; email: string; password: string; birth_day: string;
  terms_accepted: boolean; foto_perfil?: string; selfie?: string | null;
}
export interface LoginCredentials { identifier: string; password: string; }
export interface SessionResponse { access_token: string; user: User; }

export const authService = {
  register: async (data: RegisterData): Promise<SessionResponse> =>
    (await api.post<SessionResponse>('/auth/register', data)).data,
  loginManual: async (credentials: LoginCredentials): Promise<SessionResponse> =>
    (await api.post<SessionResponse>('/auth/login', credentials)).data,
  loginWithGoogle: async (token: string): Promise<SessionResponse> => {
    if (!token) throw new Error('ERR_GOOGLE_TOKEN_INVALID');
    return (await api.post<SessionResponse>('/auth/google', { token })).data;
  },
};
