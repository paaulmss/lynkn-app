import React, { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import {
  X,
  MapPin,
  Calendar,
  ChevronRight,
  Users,
  Clock,
  CheckCircle,
} from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./PostDetailModal.css";
import { useAuth } from "../../../hooks/useAuth";
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
}

interface PostDetailModalProps {
  post: PostData;
  onClose: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => {
  const { user } = useAuth();
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);

  const [joinStatus, setJoinStatus] = useState<
    "idle" | "pending" | "accepted" | "rejected"
  >("idle");
  const [loadingJoin, setLoadingJoin] = useState(false);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const isOwner = user?.id === post.user_id;

  useEffect(() => {
    const checkUserStatus = async () => {
      try {
        const response = await fetch(
          `http://localhost:4000/posts/${post.id}/participants`,
        );
        const data: Participant[] = await response.json();
        setParticipants(data);

        // Comprobamos si el usuario actual ya está en la lista
        const myRequest = data.find((p) => p.user_id === user?.id);
        if (myRequest) {
          setJoinStatus(
            myRequest.status as "pending" | "accepted" | "rejected",
          );
        }
      } catch (error) {
        console.error("Error cargando participantes:", error);
      }
    };

    if (post.id) checkUserStatus();
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
      new maplibregl.Marker({ color: "#fff" })
        .setLngLat([post.lng, post.lat])
        .addTo(map.current);
      map.current.resize();
    }, 100);
    return () => {
      clearTimeout(timer);
      map.current?.remove();
    };
  }, [post]);

  const handleJoinRequest = async () => {
  setLoadingJoin(true);
  try {
    const response = await fetch(
      `http://localhost:4000/posts/${post.id}/join`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id,
          ownerId: post.user_id
        }),
      }
    );

    if (response.ok) {
      setJoinStatus("pending");
    }
  } catch (err) {
    console.error("Error al enviar la solicitud:", err);
    alert("No se pudo enviar la solicitud");
  } finally {
    setLoadingJoin(false);
  }
};

  const handleParticipantAction = async (
    id: number,
    status: "accepted" | "rejected",
  ) => {
    try {
      await fetch(`http://localhost:4000/posts/participation/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      setParticipants((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status } : p)),
      );
    } catch (error) {
      console.error("Error al actualizar:", error);
    }
  };

  const eventDate = post.event_date
    ? new Date(post.event_date).toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Fecha no definida";

  const spotsLeft = (post.max_particip || 0) - (post.current_particip || 0);

  return (
    <div className="nomad-overlay" onClick={onClose}>
      <div className="nomad-modal" onClick={(e) => e.stopPropagation()}>
        <div className="nomad-image-section">
          <img src={post.image_url} alt={post.title} />
          <button className="nomad-close-mobile" onClick={onClose}>
            <X />
          </button>
        </div>

        <div className="nomad-info-section">
          <button className="nomad-close-desktop" onClick={onClose}>
            <X size={20} />
          </button>

          <div className="nomad-scroll-area">
            <div className="nomad-header">
              <img
                src={
                  post.users?.foto_perfil ||
                  "https://api.dicebear.com/8.x/notionists/svg?seed=Pepe"
                }
                className="nomad-avatar"
                alt="Avatar"
              />
              <div className="nomad-creator-text">
                <span className="nomad-username">
                  @{post.users?.username || "usuario"}
                </span>
                <span className="nomad-category">{post.category}</span>
              </div>
            </div>

            <h1 className="nomad-title">{post.title}</h1>
            <div className="nomad-stats-grid">
              <div className="nomad-stat-box">
                <span className="nomad-stat-value">{post.max_particip}</span>
                <span className="nomad-stat-label">PLAZAS</span>
              </div>
              <div className="nomad-stat-box">
                <span className="nomad-stat-value">
                  {post.current_particip || 0}
                </span>
                <span className="nomad-stat-label">UNIDOS</span>
              </div>
            </div>
            <p className="nomad-description">{post.description}</p>
            <div className="nomad-meta-info">
              <div className="nomad-meta-item">
                <Calendar size={16} /> <span>{eventDate}</span>
              </div>
              <div className="nomad-meta-item">
                <MapPin size={16} /> <span>Ubicación exacta tras aceptar</span>
              </div>
            </div>

            <div className="nomad-map-wrapper">
              <div ref={mapContainer} className="nomad-map-canvas" />
            </div>

            {isOwner && showAdminPanel && (
              <ParticipantsPanel
                participants={participants}
                onAction={handleParticipantAction}
              />
            )}
          </div>

          <div className="nomad-footer">
            {isOwner ? (
              <div className="nomad-admin-controls">
                <div className="nomad-footer-status">
                  <span className="nomad-spots-left">MODO ORGANIZADOR</span>
                </div>
                <button
                  className="nomad-btn-admin"
                  onClick={() => setShowAdminPanel(!showAdminPanel)}
                >
                  <Users size={18} />{" "}
                  {showAdminPanel ? "OCULTAR LISTA" : "GESTIONAR ASISTENTES"}
                  <ChevronRight
                    size={18}
                    style={{
                      transform: showAdminPanel ? "rotate(90deg)" : "none",
                      transition: "0.3s",
                    }}
                  />
                </button>
              </div>
            ) : (
              <div className="nomad-user-controls">
                <div className="nomad-footer-status">
                  <span className="nomad-spots-left">
                    {spotsLeft} plazas disponibles
                  </span>
                  <div className="nomad-bar-container">
                    <div
                      className="nomad-bar-fill"
                      style={{
                        width: `${Math.min(((post.current_particip || 0) / post.max_particip) * 100, 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>

                <button
                  className={`nomad-btn-join ${joinStatus}`}
                  onClick={handleJoinRequest}
                  disabled={
                    joinStatus !== "idle" || spotsLeft <= 0 || loadingJoin
                  }
                >
                  {joinStatus === "idle" &&
                    (loadingJoin ? (
                      "Enviando..."
                    ) : (
                      <>
                        SOLICITAR UNIRSE <ChevronRight size={18} />
                      </>
                    ))}
                  {joinStatus === "pending" && (
                    <>
                      <Clock size={18} /> SOLICITUD PENDIENTE
                    </>
                  )}
                  {joinStatus === "accepted" && (
                    <>
                      <CheckCircle size={18} /> YA ESTÁS DENTRO
                    </>
                  )}
                  {joinStatus === "rejected" && <>SOLICITUD RECHAZADA</>}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;
