import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  User, 
  PlusSquare, 
  Map as MapIcon, 
  LogOut, 
  X, 
  MessageCircle, 
  Bell, 
  Settings,
  ClipboardList
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
  const { t } = useTranslation();
  const { logout, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const isDarkMode = localStorage.getItem("theme") !== "light";

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
      <div className={`sidebar-overlay ${isOpen ? 'show' : ''}`} onClick={onClose} />

      <aside className={`sidebar-component ${isOpen ? 'open' : 'closed'} ${!isDarkMode ? 'light-mode' : ''}`}>
        <div className="sidebar-header">
          <div className="logo-section">
            <h2 className="logo-text">LYNKN</h2>
          </div>
          <button className="close-sidebar-btn" onClick={onClose}>
            <X size={24} color="var(--text-main)" />
          </button>
        </div>

        <nav className="sidebar-nav-links">
          <div className="nav-group">
            <span className="group-title">{t('sidebar.main_menu')}</span>
            
            <Link to="/explore" className={`sidebar-item ${activePage === 'explore' ? 'active' : ''}`} onClick={onClose}>
              <MapIcon size={20} /> <span>{t('sidebar.explore')}</span>
            </Link>

            <Link to="/profile" className={`sidebar-item ${activePage === 'profile' ? 'active' : ''}`} onClick={onClose}>
              <User size={20} /> <span>{t('sidebar.profile')}</span>
            </Link>

            <Link to="/messages" className={`sidebar-item ${activePage === 'messages' ? 'active' : ''}`} onClick={onClose}>
              <MessageCircle size={20} /> <span>{t('sidebar.messages')}</span>
            </Link>

            <Link to="/requests" className={`sidebar-item ${activePage === 'requests' ? 'active' : ''}`} onClick={onClose}>
              <ClipboardList size={20} /> <span>{t('sidebar.my_requests')}</span>
            </Link>

            <Link to="/notifications" className={`sidebar-item ${activePage === 'notifications' ? 'active' : ''}`} onClick={onClose}>
              <div className="icon-with-badge">
                <Bell size={20} />
                {unreadCount > 0 && <span className="sidebar-badge">{unreadCount}</span>}
              </div>
              <span>{t('sidebar.notifications')}</span>
            </Link>
          </div>

          <div className="nav-group">
            <span className="group-title">{t('sidebar.actions')}</span>
            
            <button 
              className="sidebar-item accent" 
              onClick={() => { onNewPostClick(); onClose(); }}
            >
              <PlusSquare size={20} /> <span>{t('sidebar.new_post')}</span>
            </button>

            <Link to="/settings" className={`sidebar-item ${activePage === 'settings' ? 'active' : ''}`} onClick={onClose}>
              <Settings size={20} /> <span>{t('sidebar.settings')}</span>
            </Link>
          </div>

          <div className="sidebar-footer">
            <button className="logout-btn" onClick={() => logout()}>
              <LogOut size={20} /> <span>{t('sidebar.logout')}</span>
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;