import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext'; 
import { useTranslation } from 'react-i18next';
import api from '../api/axiosConfig';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const { i18n } = useTranslation();

  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lynkn_token'));
  
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('lynkn_user');
    const savedToken = localStorage.getItem('lynkn_token');
    if (savedUser && savedToken) {
      try { return JSON.parse(savedUser); } catch { return null; }
    }
    return null;
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_status');
    return saved === 'open'; 
  });

  const updatePreferences = useCallback(async (theme: string, lang: string) => {
    if (!user) return;

    try {
      // 1. Guardar en Backend
      await api.put(`/users/${user.id}/preferences`, { theme, language: lang });

      // 2. Actualizar Usuario en el estado y storage
      const updatedUser: User = { 
        ...user, 
        theme: theme as 'light' | 'dark',
        language: lang as 'es' | 'en'
      };

      setUser(updatedUser);
      localStorage.setItem('lynkn_user', JSON.stringify(updatedUser));
      localStorage.setItem('theme', theme);

      // 3. Aplicar cambios visuales inmediatos
      i18n.changeLanguage(lang);
      document.body.className = theme === 'light' ? 'light-mode' : '';
      
    } catch (error) {
      console.error("Error al sincronizar preferencias con la DB:", error);
    }
  }, [user, i18n]);

  const updateUser = useCallback((updates: Partial<User>) => {
    setUser((currentUser) => {
      if (!currentUser) return currentUser;

      const updatedUser: User = {
        ...currentUser,
        ...updates,
        foto_perfil: updates.foto_perfil || currentUser.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${updates.username || currentUser.username}`,
      };

      localStorage.setItem('lynkn_user', JSON.stringify(updatedUser));
      return updatedUser;
    });
  }, []);

  // --- EFECTO PARA APLICAR PREFERENCIAS AL CARGAR ---
  useEffect(() => {
    if (user) {
      if (user.language) i18n.changeLanguage(user.language);
      if (user.theme) {
        document.body.className = user.theme === 'light' ? 'light-mode' : '';
        localStorage.setItem('theme', user.theme);
      }
    }
  }, [user, i18n]);

  useEffect(() => {
    localStorage.setItem('sidebar_status', isSidebarOpen ? 'open' : 'closed');
  }, [isSidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('lynkn_token');
    localStorage.removeItem('lynkn_user');
    localStorage.removeItem('theme');
    setToken(null);
    setUser(null);
    navigate('/login');
  }, [navigate]);

  const login = (data: { access_token: string; user: User }) => {
    const normalizedUser: User = {
      ...data.user,
      foto_perfil: data.user.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user.username}`
    };
    
    localStorage.setItem('lynkn_token', data.access_token);
    localStorage.setItem('lynkn_user', JSON.stringify(normalizedUser));
    
    if (normalizedUser.theme) localStorage.setItem('theme', normalizedUser.theme);
    
    setToken(data.access_token);
    setUser(normalizedUser);
    
    navigate(normalizedUser.role === 'admin' ? '/admin-panel' : '/explore');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        token, 
        login, 
        logout, 
        updatePreferences,
        updateUser,
        isAuthenticated: !!token,
        isSidebarOpen,
        setIsSidebarOpen,
        toggleSidebar
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
