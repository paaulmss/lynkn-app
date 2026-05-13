import { createContext } from 'react';

// --- INTERFACES ---
export interface User {
  id: string | number;
  email: string;
  username: string;
  theme: 'light' | 'dark';
  language: 'es' | 'en';
  role: 'admin' | 'user';
  status_verif: 'pending' | 'approved' | 'rejected' | 'unverified'; 
  foto_perfil: string; 
  bio?: string;
  location?: string;
  verif_message?: string;
}

export interface AuthContextType {
  user: User | null;
  updatePreferences: (theme: string, lang: string) => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
  token: string | null;
  login: (data: { access_token: string; user: User }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  // --- ESTADOS GLOBALES DEL SIDEBAR ---
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
