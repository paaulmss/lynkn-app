import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../hooks/useAuth";
import { Menu, BellOff } from "lucide-react";
import NotificationItem from "./NotificationItem";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import api from "../../api/axiosConfig";
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
  const { t } = useTranslation();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const userId = user?.id;
  const isDarkMode = localStorage.getItem("theme") !== "light";

  const markAllAsRead = useCallback(async () => {
    if (!userId) return;
    try {
      await api.patch(`/notifications/user/${userId}/mark-read`);
    } catch (err) {
      console.error("Error al marcar como leídas:", err);
    }
  }, [userId]);

  const fetchNotifications = useCallback((signal?: AbortSignal) => {
    if (!userId) return Promise.resolve();
    return api.get<Notification[]>('/notifications/user/' + userId, { signal })
      .then(({ data }) => {
        if (signal?.aborted) return;
        setNotifications(data || []);
        setLoadError(false);
        if (data.length) void markAllAsRead();
      }).catch((error: unknown) => {
        if (!signal?.aborted) { setLoadError(true); console.error('Error cargando notificaciones', error); }
      }).finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [userId, markAllAsRead]);

  useEffect(() => {
    if (userId) {
      const controller = new AbortController();
      void fetchNotifications(controller.signal);
      return () => controller.abort();
    }
  }, [userId, fetchNotifications]);

  return (
    <div className={`explore-container ${!isDarkMode ? 'light-mode' : ''}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="notifications"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        
        <header className="top-navbar">
          <button className="icon-btn menu-trigger" onClick={toggleSidebar} type="button">
            <Menu color={isDarkMode ? "white" : "black"} size={24} />
          </button>
          <div className="navbar-page-title">{t('notifications.nav_title')}</div>
        </header>

        <div className="notifications-page-content animate-in">
          <header className="page-header">
            <h1 className="page-title">{t('notifications.title')}</h1>
            <p className="page-subtitle">{t('notifications.subtitle')}</p>
          </header>

          <div className="notifications-container">
            {loadError ? (<div role="alert">{t("common.error")}</div>) : loading ? (
              <div className="loading-state">
                <div className="loader-dots">{t('notifications.loading')}</div>
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
                  <BellOff size={48} strokeWidth={1} color="var(--text-muted)" />
                </div>
                <h2>{t('notifications.empty_title')}</h2>
                <p>{t('notifications.empty_desc')}</p>
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
