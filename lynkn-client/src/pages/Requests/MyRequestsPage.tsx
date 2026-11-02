import { useEffect, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Calendar,
  Loader2,
  Menu,
  ClipboardList,
  AlertTriangle,
  X
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import api from "../../api/axiosConfig";
import "./MyRequestsPage.css";

// Interfaz para el modal
interface ConfirmModalState {
  isOpen: boolean;
  requestId: number | null;
}

interface RequestItem {
  id: number;
  status: "pending" | "accepted" | "rejected";
  post_id: number;
  posts: {
    title: string;
    image_url: string;
    event_date: string;
    category: string;
    users: {
      username: string;
    };
  };
}

const MyRequestsPage = () => {
  const { user, isSidebarOpen, toggleSidebar, setIsSidebarOpen } = useAuth();
  const { t } = useTranslation();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(false);
  
  // Nuevo estado para el modal personalizado
  const [confirmModal, setConfirmModal] = useState<ConfirmModalState>({
    isOpen: false,
    requestId: null
  });

  const userId = user?.id;
  const isDarkMode = localStorage.getItem("theme") !== "light";

  const fetchRequests = useCallback((signal?: AbortSignal) => {
    if (!userId) return Promise.resolve();
    return api.get<RequestItem[]>('/posts/user-requests/' + userId, { signal })
      .then(({ data }) => { if (!signal?.aborted) { setRequests(data); setLoadError(false); } })
      .catch((error: unknown) => { if (!signal?.aborted) { setLoadError(true); console.error('Error cargando solicitudes', error); } })
      .finally(() => { if (!signal?.aborted) setLoading(false); });
  }, [userId]);

  useEffect(() => {
    const controller = new AbortController();
    void fetchRequests(controller.signal);
    return () => controller.abort();
  }, [fetchRequests]);

  // Función para abrir el modal en lugar del confirm()
  const openConfirmModal = (id: number) => {
    setConfirmModal({ isOpen: true, requestId: id });
  };

  const handleCancelRequest = async () => {
    const participationId = confirmModal.requestId;
    if (!participationId) return;

    try {
      const response = await api.delete(`/posts/participation/${participationId}`);

      if (response.status >= 200 && response.status < 300) {
        setRequests((prev) => prev.filter((r) => r.id !== participationId));
        setConfirmModal({ isOpen: false, requestId: null });
      }
    } catch (error) {
      console.error("Error al cancelar:", error);
    }
  };

  return (
    <div className={`explore-container ${!isDarkMode ? 'light-mode' : ''}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="requests"
        onNewPostClick={() => {}} 
      />

      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        <header className="top-navbar">
          <button className="icon-btn menu-trigger" onClick={toggleSidebar}>
            <Menu color={isDarkMode ? "white" : "black"} size={24} />
          </button>
          <div className="navbar-page-title">{t('requests.title')}</div>
        </header>

        <div className="requests-page-wrapper animate-in">
          <header className="requests-header">
            <h1>{t('requests.title')}</h1>
            <p>{t('requests.subtitle')}</p>
          </header>

          {loadError ? (<div role="alert">{t("common.error")}</div>) : loading ? (
            <div className="requests-loading">
              <Loader2 className="spin" size={40} color="var(--neon-glow)" />
            </div>
          ) : requests.length > 0 ? (
            <div className="requests-grid">
              {requests.map((item) => (
                <div key={item.id} className={`request-card ${item.status}`}>
                  <div className="request-image-wrapper">
                    <img src={item.posts.image_url} alt={item.posts.title} />
                    <div className={`status-badge-floating ${item.status}`}>
                      {item.status === "pending" && <Clock size={12} />}
                      {item.status === "accepted" && <CheckCircle2 size={12} />}
                      {item.status === "rejected" && <XCircle size={12} />}
                      <span>{item.status.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="request-content">
                    <div className="request-info">
                      <span className="request-organizer">
                        {t('requests.organized_by')} @{item.posts.users?.username || "usuario"}
                      </span>
                      <h3>{item.posts.title}</h3>
                      <div className="request-meta">
                        <Calendar size={14} color="var(--text-muted)" />
                        <span>{new Date(item.posts.event_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      className="cancel-request-btn"
                      onClick={() => openConfirmModal(item.id)} // Llamamos al modal
                    >
                      <Trash2 size={16} />
                      <span>
                        {item.status === 'accepted' 
                          ? t('requests.btn_abandon') 
                          : t('requests.btn_cancel')}
                      </span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="requests-empty">
              <ClipboardList size={60} color="var(--text-muted)" style={{ opacity: 0.2, marginBottom: '20px' }} />
              <h3>{t('requests.empty_title')}</h3>
              <p>{t('requests.empty_desc')}</p>
            </div>
          )}
        </div>
      </main>

      {/* MODAL DE CONFIRMACIÓN PERSONALIZADO */}
      {confirmModal.isOpen && (
        <div className="custom-modal-overlay" onClick={() => setConfirmModal({ isOpen: false, requestId: null })}>
          <div className="custom-confirm-card animate-in" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setConfirmModal({ isOpen: false, requestId: null })}>
              <X size={20} />
            </button>
            
            <div className="modal-icon-warning">
              <AlertTriangle size={48} color="#ef4444" />
            </div>

            <p>{t('requests.confirm_cancel')}</p>

            <div className="modal-actions-row">
              <button 
                className="btn-modal-secondary" 
                onClick={() => setConfirmModal({ isOpen: false, requestId: null })}
              >
                {t('common.cancel')}
              </button>
              <button 
                className="btn-modal-danger" 
                onClick={handleCancelRequest}
              >
                {t('common.delete') || 'CONFIRMAR'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyRequestsPage;
