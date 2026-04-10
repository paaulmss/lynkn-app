import { useEffect, useState, useCallback } from "react";
import { useAuth } from "../../hooks/useAuth";
import { Menu, BellOff } from "lucide-react";
import NotificationItem from "./NotificationItem";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import "./NotificationsPage.css";

interface Notification {
  id: number;
  type: "join_request" | "accepted" | "rejected" | "info_pending";
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    foto_perfil: string;
  };
  posts?: {
    title: string;
  };
}

const NotificationsPage = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  
  // ESTADOS
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  /**
   * 1. MARCAR COMO LEÍDAS
   * Al entrar en la página, notificamos al servidor que el usuario ha visto los avisos.
   */
  const markAllAsRead = useCallback(async () => {
    try {
      if (!user?.id) return;
      await fetch(
        `http://localhost:4000/notifications/user/${user.id}/mark-read`,
        { method: "PATCH" }
      );
    } catch (err) {
      console.error("Error al marcar como leídas:", err);
    }
  }, [user?.id]);

  /**
   * 2. CARGAR NOTIFICACIONES
   * Trae el historial de notificaciones. 
   */
  const fetchNotifications = useCallback(async () => {
    try {
      if (!user?.id) return;

      const response = await fetch(
        `http://localhost:4000/notifications/user/${user.id}`
      );
      const data = await response.json();

      setNotifications(data || []);

      // Si hay datos, marcamos como leídos en la base de datos
      if (data && data.length > 0) {
        markAllAsRead();
      }
    } catch (error) {
      console.error("Error cargando notificaciones:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]); 

  /**
   * EFECTO DE ARRANQUE
   * Carga las notificaciones en cuanto el usuario está disponible.
   */
  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id, fetchNotifications]);

  return (
    <div className="explore-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="notifications"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        
        <header className="top-navbar">
          <button
            className="icon-btn menu-trigger"
            onClick={toggleSidebar}
            type="button"
          >
            <Menu color="white" size={24} />
          </button>
          <div className="navbar-page-title">NOTIFICACIONES</div>
        </header>

        <div className="notifications-page-content">
          <header className="page-header">
            <h1 className="page-title">CENTRO DE NOTIFICACIONES</h1>
            <p className="page-subtitle">
              Gestiona tus solicitudes y actividad reciente
            </p>
          </header>

          <div className="notifications-container">
            {loading ? (
              <div className="loading-state">
                <div className="loader-dots">Cargando avisos...</div>
              </div>
            ) : notifications.length > 0 ? (
              notifications.map((notif) => (
                <NotificationItem
                  key={notif.id}
                  notification={notif}
                />
              ))
            ) : (
              <div className="notif-empty-container">
                <div className="notif-empty-icon-circle">
                  <BellOff size={48} strokeWidth={1} color="#3f3f46" />
                </div>
                <h2>BANDEJA VACÍA</h2>
                <p>
                  Te avisaremos cuando alguien quiera unirse a tus planes o
                  tengas actividad nueva.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={() => {
            setIsCreatePostOpen(false);
            fetchNotifications(); 
          }}
        />
      )}
    </div>
  );
};

export default NotificationsPage;