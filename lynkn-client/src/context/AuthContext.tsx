import { createContext } from 'react';

// --- INTERFACES ---
import type { User } from '../types';
export type { User } from '../types';

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
