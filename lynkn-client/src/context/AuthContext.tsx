import { createContext } from 'react';

// --- INTERFACES ---
export interface User {
  id: string | number;
  email: string;
  username: string;
  role: 'admin' | 'user';
  status_verif: 'pending' | 'approved' | 'rejected';
  foto_perfil: string; 
  bio?: string;
  location?: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (data: { access_token: string; user: User }) => void;
  logout: () => void;
  isAuthenticated: boolean;
  // --- ESTADOS GLOBALES DEL SIDEBAR ---
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

// Aquí no usamos useState ni useEffect, por eso los borramos del import
export const AuthContext = createContext<AuthContextType | undefined>(undefined);