import React, { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import {
  X,
  MapPin,
  Calendar,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
  AlertTriangle,
  Trash2,
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
  isOpen,
  onClose,
  onConfirm,
  title,
  isLoading,
}) => {
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <div className="confirm-modal-overlay" onClick={onClose}>
      <div className="confirm-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-modal-icon">
          <AlertTriangle size={48} color="#ef4444" />
        </div>
        <h3>{t('confirm_delete.title')}</h3>
        <p dangerouslySetInnerHTML={{ __html: t('confirm_delete.warning', { title }) }} />
        <div className="confirm-modal-actions">
          <button className="btn-cancel" onClick={onClose} disabled={isLoading}>{t('common.cancel')}</button>
          <button className="btn-confirm-delete" onClick={onConfirm} disabled={isLoading}>
            {isLoading ? t('confirm_delete.btn_loading') : t('confirm_delete.confirm')}
          </button>
        </div>
      </div>
    </div>
  );
};

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const [currentParticipLocal, setCurrentParticipLocal] = useState<number>(
    Math.floor(post.current_particip || 0)
  );

  const [joinStatus, setJoinStatus] = useState<"idle" | "pending" | "accepted" | "rejected">(
    post.userStatus === "available" || !post.userStatus
      ? "idle"
      : (post.userStatus as "pending" | "accepted" | "rejected"),
  );
  const [loadingJoin, setLoadingJoin] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

  const isOwner = user?.id === post.user_id;
  const isUnlimited = post.max_particip === 0;
  const max = Math.floor(post.max_particip || 0);
  const percentage = isUnlimited ? 0 : Math.min(100, Math.floor((currentParticipLocal / (max || 1)) * 100));
  const spotsLeft = isUnlimited ? null : Math.max(0, max - currentParticipLocal);
  const isFull = !isUnlimited && currentParticipLocal >= max;

  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const response = await api.get(`/posts/${post.id}/participants`);
        const filteredData = response.data.filter(
          (p: Participant) => Number(p.user_id) !== Number(post.user_id)
        );
        setParticipants(filteredData);
      } catch (err) {
        console.error("Error cargando participantes:", err);
      }
    };
    if (post.id) fetchParticipants();
  }, [post.id, post.user_id]);

  useEffect(() => {
    if (!mapContainer.current || !post.lat || !post.lng) return;
    const isDarkMode = localStorage.getItem("theme") !== "light";
    const styleName = isDarkMode ? "alidade_smooth_dark" : "alidade_smooth";
    const timer = setTimeout(() => {
      map.current = new maplibregl.Map({
        container: mapContainer.current!,
        style: `https://tiles.stadiamaps.com/styles/${styleName}.json?api_key=${import.meta.env.VITE_STADIA_API_KEY}`,
        center: [post.lng, post.lat],
        zoom: 15,
        attributionControl: false,
      });
      new maplibregl.Marker({ color: isDarkMode ? "#fff" : "#000" })
        .setLngLat([post.lng, post.lat])
        .addTo(map.current);
      map.current.resize();
    }, 100);
    return () => {
      clearTimeout(timer);
      map.current?.remove();
    };
  }, [post]);

  useEffect(() => {
    if (showAdminPanel && scrollAreaRef.current) {
      setTimeout(() => {
        scrollAreaRef.current?.scrollTo({
          top: scrollAreaRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }, 100);
    }
  }, [showAdminPanel]);

  const handleJoinRequest = async () => {
    setLoadingJoin(true);
    try {
      const response = await api.post(`/posts/${post.id}/join`, {
        userId: user?.id,
        ownerId: post.user_id,
      });
      if (response.status === 201 || response.status === 200) {
        setJoinStatus(isUnlimited ? "accepted" : "pending");
        if (isUnlimited) setCurrentParticipLocal(prev => prev + 1);
        toast.success("Solicitud enviada");
      }
    } catch {
      toast.error("No se pudo enviar la solicitud");
    } finally {
      setLoadingJoin(false);
    }
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
      const participant = participants.find(p => p.id === id);
      if (!participant) return;
      const wasAccepted = participant.status === 'accepted';

      await api.patch(`/posts/participation/${id}`, { status });
      
      setParticipants((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));

      if (status === 'accepted' && !wasAccepted) {
        setCurrentParticipLocal(prev => prev + 1);
      } else if (status === 'rejected' && wasAccepted) {
        setCurrentParticipLocal(prev => Math.max(0, prev - 1));
      }
      toast.success("Estado actualizado");
    } catch {
      toast.error("Error al procesar la acción");
    }
  };

  const eventDate = post.event_date
    ? new Date(post.event_date).toLocaleDateString(i18n.language === 'es' ? "es-ES" : "en-US", {
        month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
      })
    : t('profile.no_location');

  return (
    <div className="nomad-overlay" onClick={onClose}>
      <div className="nomad-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nomad-image-section">
          <img src={post.image_url} alt={post.title} />
        </div>

        <div className="nomad-info-section">
          <button className="nomad-close-desktop" onClick={onClose}><X size={20} /></button>

          <div className="nomad-scroll-area" ref={scrollAreaRef}>
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
                  <svg width="80" height="80" viewBox="0 0 80 80">
                    <circle className="circle-bg" cx="40" cy="40" r={radius} />
                    <circle
                      className="circle-progress"
                      cx="40" cy="40" r={radius}
                      style={{
                        strokeDasharray: circumference,
                        strokeDashoffset: offset,
                        stroke: percentage > 80 ? "#ef4444" : "#00f2ff",
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
                <span className="nomad-stat-label">{t('post_detail.total_spots')}</span>
              </div>
              <div className="nomad-stat-box">
                <span className="nomad-stat-value">{currentParticipLocal}</span>
                <span className="nomad-stat-label">{t('post_detail.joined_people')}</span>
              </div>
            </div>

            <p className="nomad-description">{post.description}</p>

            <div className="nomad-meta-info">
              <div className="nomad-meta-item"><Calendar size={16} /> <span>{eventDate}</span></div>
              <div className="nomad-meta-item">
                <MapPin size={16} /> 
                <span>
                  {isUnlimited || joinStatus === "accepted" 
                    ? t('post_detail.loc_active') 
                    : t('post_detail.loc_restricted')}
                </span>
              </div>
            </div>

            <div className="nomad-map-wrapper">
              <div ref={mapContainer} className="nomad-map-canvas" />
            </div>

            {/* PANEL DE ASISTENTES */}
            {isOwner && showAdminPanel && (
              <div className="admin-panel-wrapper animate-in">
                <ParticipantsPanel
                  participants={participants}
                  onAction={handleParticipantAction}
                  isFull={isFull}
                  ownerId={post.user_id}
                />
              </div>
            )}
          </div>

          <div className="nomad-footer">
            {isOwner ? (
              <div className="nomad-admin-controls">
                <button className="btn-delete-post" onClick={() => setIsDeleteModalOpen(true)}>
                  <Trash2 size={18} /> {t('post_detail.btn_delete')}
                </button>
                <button className="nomad-btn-admin" onClick={() => setShowAdminPanel(!showAdminPanel)}>
                  <Users size={18} /> {showAdminPanel ? t('post_detail.btn_hide') : t('post_detail.btn_manage')}
                  <ChevronRight size={18} style={{ transform: showAdminPanel ? "rotate(90deg)" : "none", transition: "0.3s" }} />
                </button>
              </div>
            ) : (
              <div className="nomad-user-controls">
                <div className="nomad-footer-status">
                  <span className="nomad-spots-left" style={{ color: percentage > 90 ? "#ef4444" : "#71717a" }}>
                   {isUnlimited 
                      ? t('post_detail.unlimited_event') 
                      : t('post_detail.spots_left', { count: spotsLeft })}
                  </span>
                  {!isUnlimited && (
                    <div className="nomad-bar-container">
                      <div className="nomad-bar-fill" style={{ width: `${percentage}%`, backgroundColor: percentage > 80 ? "#ef4444" : "var(--text-main)" }}></div>
                    </div>
                  )}
                </div>

                {joinStatus === "rejected" ? (
                  <button className="nomad-btn-status-redirect rejected" disabled>
                    <X size={18} /> {t('post_detail.status.denied')}
                  </button>
                ) : joinStatus === "idle" ? (
                  <button className="nomad-btn-join" onClick={handleJoinRequest} disabled={(!isUnlimited && spotsLeft! <= 0) || loadingJoin}>
                    {loadingJoin ? t('post_detail.status.joining') : <>{t('post_detail.status.join')} <ChevronRight size={18} /></>}
                  </button>
                ) : (
                  <button className={`nomad-btn-status-redirect ${joinStatus}`} onClick={() => { onClose(); navigate("/requests"); }}>
                    <div className="status-label-content">
                      {joinStatus === "pending" && <Clock size={18} />}
                      {joinStatus === "accepted" && <CheckCircle size={18} />}
                      <span>{t(`post_detail.status.${joinStatus}`)}</span>
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