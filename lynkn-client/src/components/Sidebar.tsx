import { useEffect, useState } from 'react'; // Añadimos hooks
import { 
  User, 
  PlusSquare, 
  Map as MapIcon, 
  LogOut, 
  X, 
  MessageCircle, 
  Bell, 
  Settings 
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Sidebar.css';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activePage?: string;
  onNewPostClick: () => void;
}

const Sidebar = ({ isOpen, onClose, activePage, onNewPostClick }: SidebarProps) => {
  const { logout, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        if (!user?.id) return;
        const response = await fetch(`http://localhost:4000/notifications/user/${user.id}/unread-count`);
        const data = await response.json();
        setUnreadCount(data.count);
      } catch (err) {
        console.error("Error al obtener conteo de notificaciones:", err);
      }
    };

    fetchUnreadCount();
  }, [user?.id, activePage]); 

  return (
    <>
      <div 
        className={`sidebar-overlay ${isOpen ? 'show' : ''}`} 
        onClick={onClose} 
      />

      <aside className={`sidebar-component ${isOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <div className="logo-glow"></div>
            <h2 className="logo-text">LYNKN</h2>
          </div>
          <button className="close-sidebar-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <nav className="sidebar-nav-links">
          <div className="nav-group">
            <span className="group-title">MENÚ PRINCIPAL</span>
            
            <Link to="/explore" className={`sidebar-item ${activePage === 'explore' ? 'active' : ''}`} onClick={onClose}>
              <MapIcon size={20} /> <span>Explorar</span>
            </Link>

            <Link to="/profile" className={`sidebar-item ${activePage === 'profile' ? 'active' : ''}`} onClick={onClose}>
              <User size={20} /> <span>Perfil</span>
            </Link>

            <Link to="/messages" className={`sidebar-item ${activePage === 'messages' ? 'active' : ''}`} onClick={onClose}>
              <MessageCircle size={20} /> <span>Mensajes</span>
            </Link>

            <Link to="/notifications" className={`sidebar-item ${activePage === 'notifications' ? 'active' : ''}`} onClick={onClose}>
              <div className="icon-with-badge">
                <Bell size={20} />
                {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
              </div>
              <span>Notificaciones</span>
            </Link>
          </div>

          <div className="nav-group">
            <span className="group-title">ACCIONES</span>
            
            <button 
              className="sidebar-item accent no-button-styles" 
              onClick={() => { onNewPostClick(); onClose(); }}
            >
              <PlusSquare size={20} /> <span>Nuevo Post</span>
            </button>

            <Link to="/settings" className={`sidebar-item ${activePage === 'settings' ? 'active' : ''}`} onClick={onClose}>
              <Settings size={20} /> <span>Ajustes</span>
            </Link>
          </div>

          <div className="sidebar-footer">
            <button 
              className="logout-btn" 
              onClick={() => logout()}
            >
              <LogOut size={20} /> <span>Cerrar Sesión</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;