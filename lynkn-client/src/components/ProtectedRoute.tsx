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

  //Si no hay token o no está autenticado, al login
  if (!isAuthenticated || !token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // LÓGICA DE APROBACIÓN: 
  // Si no es admin y su estado no es 'approved', bloqueamos el acceso.
  const isApproved = user?.status_verif === 'approved';
  const isAdmin = user?.role === 'admin';

  if (!isAdmin && !isApproved) {
    console.warn("Acceso restringido: Cuenta en estado", user?.status_verif);
    return <Navigate to="/profile" replace />; 
  }

  // LÓGICA DE ADMIN:
  // Si la ruta es exclusiva de admin y el usuario no tiene el rol, al explore
  if (adminOnly && !isAdmin) {
    console.warn("Acceso denegado: Se requiere rol de administrador");
    return <Navigate to="/explore" replace />;
  }

  //Si pasa todos los filtros, renderizamos el contenido
  return <>{children}</>;
};

export default ProtectedRoute;