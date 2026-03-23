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
  const { logout } = useAuth();

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
            
            <Link to="/explore" className={`sidebar-item ${activePage === 'explore' ? 'active' : ''}`}>
              <MapIcon size={20} /> <span>Explorar</span>
            </Link>

            <Link to="/profile" className={`sidebar-item ${activePage === 'profile' ? 'active' : ''}`}>
              <User size={20} /> <span>Perfil</span>
            </Link>

            <Link to="/messages" className={`sidebar-item ${activePage === 'messages' ? 'active' : ''}`}>
              <MessageCircle size={20} /> <span>Mensajes</span>
            </Link>

            <Link to="/notifications" className={`sidebar-item ${activePage === 'notifications' ? 'active' : ''}`}>
              <Bell size={20} /> <span>Notificaciones</span>
            </Link>
          </div>

          <div className="nav-group">
            <span className="group-title">ACCIONES</span>
            
            <button 
              className="sidebar-item accent no-button-styles" 
              onClick={onNewPostClick}
            >
              <PlusSquare size={20} /> <span>Nuevo Post</span>
            </button>

            <Link to="/settings" className={`sidebar-item ${activePage === 'settings' ? 'active' : ''}`}>
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