import { useEffect, useState, useCallback } from "react";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  Trash2, 
  Calendar,
  Loader2,
  Menu,
  ClipboardList
} from "lucide-react";
import Sidebar from "../../components/Sidebar";
import { useAuth } from "../../hooks/useAuth";
import "./MyRequestsPage.css";

interface RequestItem {
  id: number;
  status: "pending" | "accepted" | "rejected";
  post_id: number;
  posts: {
    title: string;
    image_url: string;
    event_date: string;
    category: string;
  };
}

const MyRequestsPage = () => {
  const { user, isSidebarOpen, toggleSidebar, setIsSidebarOpen } = useAuth();
  const [requests, setRequests] = useState<RequestItem[]>([]);
  const [loading, setLoading] = useState(true);

  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const fetchRequests = useCallback(async () => {
    try {
      if (!user?.id) return;
      const response = await fetch(`${apiUrl}/posts/user-requests/${user.id}`);
      const data = await response.json();
      setRequests(data);
    } catch (error) {
      console.error("Error al cargar solicitudes:", error);
    } finally {
      setLoading(false);
    }
  }, [user?.id, apiUrl]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  const handleCancelRequest = async (participationId: number) => {
    const confirmMsg = "¿Estás seguro de que quieres cancelar esta solicitud o abandonar el evento?";
    if (!window.confirm(confirmMsg)) return;

    try {
      const response = await fetch(`${apiUrl}/posts/participation/${participationId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setRequests((prev) => prev.filter((r) => r.id !== participationId));
      }
    } catch (error) {
      console.error("Error al cancelar:", error);
    }
  };

  return (
    <div className="explore-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="requests"
        onNewPostClick={() => {}} 
      />

      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        <header className="top-navbar">
          <button className="icon-btn menu-trigger" onClick={toggleSidebar}>
            <Menu color="white" size={24} />
          </button>
          <div className="navbar-page-title">MIS SOLICITUDES</div>
        </header>

        <div className="requests-page-wrapper">
          <header className="requests-header">
            <h1>MIS SOLICITUDES</h1>
            <p>Gestiona tus inscripciones y estados de eventos</p>
          </header>

          {loading ? (
            <div className="requests-loading">
              <Loader2 className="spin" size={40} color="#00f2ff" />
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
                      <span className="request-category">{item.posts.category}</span>
                      <h3>{item.posts.title}</h3>
                      <div className="request-meta">
                        <Calendar size={14} />
                        <span>{new Date(item.posts.event_date).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <button 
                      className="cancel-request-btn"
                      onClick={() => handleCancelRequest(item.id)}
                    >
                      <Trash2 size={18} />
                      <span>{item.status === 'accepted' ? 'ABANDONAR' : 'CANCELAR'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="requests-empty">
              <ClipboardList size={60} style={{ opacity: 0.1, marginBottom: '20px' }} />
              <h3>No tienes solicitudes activas</h3>
              <p>Explora el mapa y únete a nuevas experiencias.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default MyRequestsPage;