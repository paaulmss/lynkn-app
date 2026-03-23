import React, { useEffect, useRef } from "react";
import maplibregl from "maplibre-gl";
import { X, MapPin, Calendar, ChevronRight } from "lucide-react";
import "maplibre-gl/dist/maplibre-gl.css";
import "./PostDetailModal.css";

interface PostDetailModalProps {
  post: any;
  onClose: () => void;
}

const PostDetailModal: React.FC<PostDetailModalProps> = ({ post, onClose }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);

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

  const eventDate = new Date(post.event_date).toLocaleDateString("es-ES", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const spotsLeft = (post.max_particip || 0) - (post.current_particip || 0);

  return (
    <div className="nomad-overlay" onClick={onClose}>
      <div className="nomad-modal" onClick={(e) => e.stopPropagation()}>
        
        {/* Columna Imagen */}
        <div className="nomad-image-section">
          <img src={post.image_url} alt={post.title} />
          <button className="nomad-close-mobile" onClick={onClose}><X /></button>
        </div>

        {/* Columna Información */}
        <div className="nomad-info-section">
          <button className="nomad-close-desktop" onClick={onClose}><X size={20} /></button>
          
          <div className="nomad-scroll-area">
            <div className="nomad-header">
              <img 
                src={post.users?.foto_perfil || "https://api.dicebear.com/8.x/notionists/svg?seed=Pepe"} 
                className="nomad-avatar" 
              />
              <div className="nomad-creator-text">
                <span className="nomad-username">@{post.users?.username}</span>
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
                <span className="nomad-stat-value">{post.current_particip || 0}</span>
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
          </div>

          {/* Footer Unificado (Sin Comentarios ni Likes) */}
          <div className="nomad-footer">
            <div className="nomad-footer-status">
              <span className="nomad-spots-left">{spotsLeft} plazas disponibles</span>
              <div className="nomad-bar-container">
                <div 
                  className="nomad-bar-fill" 
                  style={{ width: `${((post.current_particip || 0) / post.max_particip) * 100}%` }}
                ></div>
              </div>
            </div>
            <button className="nomad-btn-primary" onClick={() => alert("Solicitud enviada")}>
              SOLICITAR UNIRSE <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;