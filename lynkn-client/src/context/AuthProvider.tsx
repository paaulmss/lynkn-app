import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import type { User } from './AuthContext'; 

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();

  // --- ESTADO DE AUTENTICACIÓN ---
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('lynkn_token'));
  
  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('lynkn_user');
    const savedToken = localStorage.getItem('lynkn_token');
    if (savedUser && savedToken) {
      try { 
        return JSON.parse(savedUser); 
      } catch { 
        return null; 
      }
    }
    return null;
  });

  // --- LÓGICA GLOBAL DEL SIDEBAR ---
  // Inicializamos leyendo de localStorage para que persista entre páginas y recargas
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(() => {
    const saved = localStorage.getItem('sidebar_status');
    return saved === 'open'; 
  });

  // Cada vez que isSidebarOpen cambie, lo guardamos en el storage
  useEffect(() => {
    localStorage.setItem('sidebar_status', isSidebarOpen ? 'open' : 'closed');
  }, [isSidebarOpen]);

  const toggleSidebar = useCallback(() => {
    setIsSidebarOpen(prev => !prev);
  }, []);

  // --- FUNCIONES DE AUTENTICACIÓN ---
  const logout = useCallback(() => {
    localStorage.removeItem('lynkn_token');
    localStorage.removeItem('lynkn_user');
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