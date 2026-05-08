import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import axios from "axios";
import {
  X,
  MapPin,
  Calendar,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import "maplibre-gl/dist/maplibre-gl.css";
import "./PostDetailModal.css";
import "../ConfirmDeleteModal.css"; 
import { useAuth } from "../../../hooks/useAuth";
import api from "../../../api/axiosConfig";
import ParticipantsPanel, { type Participant } from "./ParticipantsPanel";

interface PostData {
  id: number;
  user_id: number;
  title: string;
  description: string;
  image_url: string;
  category: string;
  lat: number;
  lng: number;
  max_particip: number;
  current_particip?: number;
  event_date: string;
  users?: {
    username: string;
    foto_perfil: string;
  };
  userStatus?: "available" | "pending" | "accepted" | "rejected";
}

interface PostDetailModalProps {
  post: PostData;
  onClose: () => void;
}

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  isLoading: boolean;
}

const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({ 
  isOpen, onClose, onConfirm, title, isLoading 
}) => {
  if (!isOpen) return null;
  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={e => e.stopPropagation()}>
        <div className="confirm-modal-icon">
          <AlertTriangle size={48} color="#ef4444" />
        </div>
        <h3>¿ELIMINAR EVENTO?</h3>
        <p>Estás a punto de borrar <strong>"{title}"</strong>. Esta acción es irreversible y eliminará todos los datos asociados.</p>
        <div className="confirm-modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isLoading}>CANCELAR</button>
          <button className="btn-confirm-delete" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? "ELIMINANDO..." : "SÍ, ELIMINAR"}
          </button>
        </div>
      </div>
    </div>
  );
};

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
  const [joinStatus, setJoinStatus] = useState<"idle" | "pending" | "accepted" | "rejected">(
    post.userStatus === "available" || !post.userStatus 
      ? "idle" 
      : (post.userStatus as "pending" | "accepted" | "rejected")
  );
  const [loadingJoin, setLoadingJoin] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  
  const isOwner = user?.id === post.user_id;
  const isUnlimited = post.max_particip === 0;
  
  const current = Math.floor(post.current_particip || 0);
  const max = Math.floor(post.max_particip || 0);
  const percentage = isUnlimited ? 0 : Math.min(100, Math.floor((current / (max || 1)) * 100));
  const spotsLeft = isUnlimited ? null : Math.max(0, max - current);
  const isFull = !isUnlimited && current >= max;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await api.get(`/posts/${post.id}/participants`);
        setParticipants(response.data);
        
        const myRequest = response.data.find((p: Participant) => p.user_id === user?.id);
        if (myRequest) {
          setJoinStatus(myRequest.status as "pending" | "accepted" | "rejected");
        }
      } catch (err) {
        console.error("Error cargando participantes:", err);
      }
    };
    if (post.id) fetchParticipants();
  }, [post.id, user?.id]);

  useEffect(() => {
    if (!mapContainer.current || !post.lat || !post.lng) return;
    const timer = setTimeout(() => {
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json?api_key=${import.meta.env.VITE_STADIA_API_KEY}`,
        center: [post.lng, post.lat],
        zoom: 15,
        attributionControl: false,
      });
      new maplibregl.Marker({ color: "#fff" }).setLngLat([post.lng, post.lat]).addTo(map.current);
      map.current.resize();
    }, 100);
    return () => { clearTimeout(timer); map.current?.remove(); };
  }, [post]);

  const handleJoinRequest = async () => {
    setLoadingJoin(true);
    try {
      const response = await api.post(`/posts/${post.id}/join`, { 
        userId: user?.id, 
        ownerId: post.user_id 
      });
      if (response.status === 201 || response.status === 200) {
        setJoinStatus(isUnlimited ? "accepted" : "pending");
        toast.success("Solicitud enviada");
      }
    } catch {
      toast.error("No se pudo enviar la solicitud");
    } finally { setLoadingJoin(false); }
  };

  const handleDeletePost = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/posts/${post.id}?userId=${user?.id}`);
      toast.success("Evento eliminado");
      onClose();
      window.location.reload();
    } catch {
      toast.error("Error al eliminar el post");
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
    }
  };

  const handleParticipantAction = async (id: number, status: "accepted" | "rejected") => {
    try {
      await api.patch(`/posts/participation/${id}`, { status });
      
      const wasAccepted = participants.find(p => p.id === id)?.status === 'accepted';

      setParticipants((prev) => 
        prev.map((p) => (p.id === id ? { ...p, status } : p))
      );

      if (status === 'accepted') {
        post.current_particip = (post.current_particip || 0) + 1;
        toast.success("Participante aceptado");
      } else {
        if (wasAccepted) {
          post.current_particip = Math.max(0, (post.current_particip || 0) - 1);
        }
        toast.info("Acción procesada");
      }
    } catch (error) {
      let errorMsg = "Error al procesar la acción";
      
      if (axios.isAxiosError(error)) {
        errorMsg = error.response?.data?.message || errorMsg;
      }
      
      console.error("Error:", error);
      toast.error(errorMsg);
    }
  };

  const eventDate = post.event_date
    ? new Date(post.event_date).toLocaleDateString("es-ES", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : "Fecha no definida";

  return (
    <div className="nomad-overlay" onClick={onClose}>
      <div className="nomad-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nomad-image-section">
          <img src={post.image_url} alt={post.title} />
          <button className="nomad-close-mobile" onClick={onClose}><X /></button>
        </div>

        <div className="nomad-info-section">
          <button className="nomad-close-desktop" onClick={onClose}><X size={20} /></button>

          <div className="nomad-scroll-area">
            <div className="nomad-header">
              <img
                src={post.users?.foto_perfil || "https://api.dicebear.com/8.x/notionists/svg?seed=Pepe"}
                className="nomad-avatar"
                alt="Avatar"
              />
              <div className="nomad-creator-text">
                <span className="nomad-username">@{post.users?.username || "usuario"}</span>
              </div>
            </div>

            <div className="title-stats-row">
              <h1 className="nomad-title">{post.title}</h1>
              {!isUnlimited && (
                <div className="circular-progress-container">
                  <svg width="80" height="80">
                    <circle className="circle-bg" cx="40" cy="40" r={radius} />
                    <circle 
                      className="circle-progress" 
                      cx="40" cy="40" r={radius} 
                      style={{ 
                        strokeDasharray: circumference, 
                        strokeDashoffset: offset,
                        stroke: percentage > 80 ? '#ef4444' : '#00f2ff' 
                      }}
                    />
                  </svg>
                  <span className="percentage-display">{percentage}%</span>
                </div>
              )}
            </div>
            
            <div className="nomad-stats-grid">
              <div className="nomad-stat-box">
                <span className="nomad-stat-value">{isUnlimited ? "∞" : max}</span>
                <span className="nomad-stat-label">TOTAL PLAZAS</span>
              </div>
              <div className="nomad-stat-box">
                <span className="nomad-stat-value">{current}</span>
                <span className="nomad-stat-label">GENTE UNIDA</span>
              </div>
            </div>

            <p className="nomad-description">{post.description}</p>
            
            <div className="nomad-meta-info">
              <div className="nomad-meta-item"><Calendar size={16} /> <span>{eventDate}</span></div>
              <div className="nomad-meta-item">
                <MapPin size={16} /> <span>{isUnlimited || joinStatus === 'accepted' ? 'Ubicación activa' : 'Ubicación exacta tras aceptar'}</span>
              </div>
            </div>

            <div className="nomad-map-wrapper">
              <div ref={mapContainer} className="nomad-map-canvas" />
            </div>

            {isOwner && showAdminPanel && (
              <ParticipantsPanel 
                participants={participants} 
                onAction={handleParticipantAction}
                isFull={isFull}
              />
            )}
          </div>

          <div className="nomad-footer">
            {isOwner ? (
              <div className="nomad-admin-controls">
                <button className="btn-delete-post" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash2 size={18} /> ELIMINAR
                </button>
                <button className="nomad-btn-admin" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                  <Users size={18} /> {showAdminPanel ? "OCULTAR" : "GESTIONAR"}
                  <ChevronRight size={18} style={{ transform: showAdminPanel ? "rotate(90deg)" : "none", transition: "0.3s" }} />
                </button>
              </div>
            ) : (
              <div className="nomad-user-controls">
                <div className="nomad-footer-status">
                  <span className="nomad-spots-left" style={{ color: percentage > 90 ? '#ef4444' : '#71717a' }}>
                    {isUnlimited ? "EVENTO ILIMITADO" : `${spotsLeft} plazas disponibles`}
                  </span>
                  {!isUnlimited && (
                    <div className="nomad-bar-container">
                      <div className="nomad-bar-fill" style={{ width: `${percentage}%`, backgroundColor: percentage > 80 ? '#ef4444' : '#fff' }}></div>
                    </div>
                  )}
                </div>
                
                {joinStatus === "rejected" ? (
                  <button className="nomad-btn-status-redirect rejected" disabled>
                    <X size={18} /> ACCESO DENEGADO
                  </button>
                ) : joinStatus === "idle" ? (
                  <button className="nomad-btn-join" onClick={handleJoinRequest} disabled={(!isUnlimited && spotsLeft! <= 0) || loadingJoin}>
                    {loadingJoin ? "Enviando..." : <>SOLICITAR UNIRSE <ChevronRight size={18} /></>}
                  </button>
                ) : (
                  <button className={`nomad-btn-status-redirect ${joinStatus}`} onClick={() => { onClose(); navigate('/requests'); }}>
                    <div className="status-label-content">
                      {joinStatus === 'pending' && <Clock size={18} />}
                      {joinStatus === 'accepted' && <CheckCircle size={18} />}
                      <span>{joinStatus === 'accepted' ? 'INSCRITO - GESTIONAR' : joinStatus.toUpperCase()}</span>
                    </div>
                    <ChevronRight size={18} />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <ConfirmDeleteModal 
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeletePost}
        title={post.title}
        isLoading={isDeleting}
      />
    </div>
  );
};

export default PostDetailModal;