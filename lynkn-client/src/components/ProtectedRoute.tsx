import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

// Definimos la interfaz para las props del componente
interface Props {
  children: React.ReactNode; 
  adminOnly?: boolean;
}

const ProtectedRoute = ({ children, adminOnly = false }: Props) => {
  const { user, isAuthenticated, token } = useAuth();
  const location = useLocation();

  // 1. SEGURIDAD BASICA
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  const isAdmin = user?.role === 'admin';

  // 2. LOGICA DE ADMIN: 
  // Si la ruta requiere ser admin y el usuario no lo es, lo mandamos a la pagina principal (explore).
  if (adminOnly && !isAdmin) {
    console.warn("Acceso denegado: Se requiere rol de administrador");
    return <Navigate to="/explore" replace />;
  }

  // 3. NAVEGACION LIBRE
  return <>{children}</>;
};

export default ProtectedRoute;