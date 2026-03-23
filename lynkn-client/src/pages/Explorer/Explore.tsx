import { useState, useEffect, useRef, useCallback } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import {
  Map as MapIcon,
  LayoutList,
  Menu,
  Search,
  Filter,
} from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import PostDetailModal from "../../components/posts/PostDetailModal/PostDetailModal";
import PostCard from "../../components/posts/PostCard/PostCard";
import api from "../../api/axiosConfig";
import "./Explore.css";

// --- DEFINICIÓN DE TIPOS ---
interface Post {
  id: number;
  title: string;
  description: string;
  image_url: string;
  lat: number;
  lng: number;
  category: string;
  max_particip?: number;
  event_date?: string;
  users: {
    username: string;
    foto_perfil: string;
  };
}

interface UserData {
  id: string | number;
  email: string;
  username: string;
  role: "admin" | "user";
  status_verif: "pending" | "approved" | "rejected";
  foto_perfil?: string;
}

const SecurityOverlay = ({ user }: { user: UserData | null }) => {
  const isAccessGranted = user?.role === "admin" || user?.status_verif === "approved";
  if (!user || isAccessGranted) return null;

  return (
    <div className="security-lock-overlay">
      <div className="lock-content">
        {user.status_verif === "pending" ? (
          <>
            <h2>ACCESO EN REVISIÓN</h2>
            <p>Tu solicitud está siendo validada. El acceso se activará tras la aprobación.</p>
          </>
        ) : (
          <>
            <h2>ACCESO DENEGADO</h2>
            <p>Tu identidad no pudo ser verificada. El acceso está restringido.</p>
            <button className="reverify-btn" onClick={() => (window.location.href = "/profile")}>
              VOLVER A VERIFICAR
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Explore = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const [viewMode, setViewMode] = useState<"map" | "posts">("map");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  const loadPosts = useCallback(async (isMounted: boolean) => {
    try {
      const response = await api.get("/posts");
      if (isMounted) setPosts(response.data);
    } catch (error) {
      console.error("Error al cargar los posts:", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    loadPosts(isMounted);
    return () => { isMounted = false; };
  }, [loadPosts]);

  // Inicialización del Mapa
  useEffect(() => {
    if (viewMode !== "map" || !mapContainer.current) return;

    const API_KEY = import.meta.env.VITE_STADIA_API_KEY;
    const mapStyle = `https://tiles.stadiamaps.com/styles/alidade_smooth_dark.json${API_KEY ? `?api_key=${API_KEY}` : ""}`;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-3.7037, 40.4167],
      zoom: 12,
      attributionControl: false,
    });

    map.current.addControl(new maplibregl.NavigationControl({ showCompass: false }), "bottom-right");

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [viewMode]);

  // Marcadores con Popups estilizados
  useEffect(() => {
    if (!map.current || posts.length === 0) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    posts.forEach((post) => {
      const el = document.createElement("div");
      el.className = "post-marker-neon";
      if (post.image_url) el.style.backgroundImage = `url(${post.image_url})`;

      const marker = new maplibregl.Marker(el)
        .setLngLat([post.lng, post.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: "custom-popup-dark" })
            .setHTML(`
            <div class="popup-card-explore">
              <img src="${post.image_url}" />
              <div class="popup-body-explore">
                <strong>${post.title}</strong>
                <span>@${post.users?.username}</span>
                <button class="popup-view-btn" id="btn-${post.id}">VER DETALLES</button>
              </div>
            </div>
          `)
        )
        .addTo(map.current!);

        marker.getPopup().on('open', () => {
            document.getElementById(`btn-${post.id}`)?.addEventListener('click', () => {
                setSelectedPost(post);
            });
        });

      markers.current.push(marker);
    });
  }, [posts, viewMode]);

  useEffect(() => {
    const timer = setTimeout(() => map.current?.resize(), 300);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const handlePostSuccess = () => {
    setIsCreatePostOpen(false);
    loadPosts(true); 
  };

  const isLocked = user?.role !== "admin" && user?.status_verif !== "approved";

  return (
    <div className="explore-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="explore"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        <header className="top-navbar">
          <button className="icon-btn menu-trigger" onClick={toggleSidebar} type="button">
            <Menu color="white" size={24} />
          </button>
          <div className="search-bar">
            <Search size={18} color="#71717a" />
            <input type="text" placeholder="BUSCAR EVENTOS, GRUPOS..." />
            <Filter size={18} color="#71717a" />
          </div>
        </header>

        <section className={`view-area ${isLocked ? "locked" : ""}`}>
          <SecurityOverlay user={user} />

          {viewMode === "map" ? (
            <div ref={mapContainer} className="map-div" />
          ) : (
            <div className="explore-posts-grid">
               {posts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  onClick={() => setSelectedPost(post)} 
                />
              ))}
            </div>
          )}
        </section>

        <div className="mode-switcher">
          <button className={`switch-nav-btn ${viewMode === "map" ? "active" : ""}`} onClick={() => setViewMode("map")}>
            <MapIcon size={18} /> MAPA
          </button>
          <button className={`switch-nav-btn ${viewMode === "posts" ? "active" : ""}`} onClick={() => setViewMode("posts")}>
            <LayoutList size={18} /> POSTS
          </button>
        </div>
      </main>

      {selectedPost && (
        <PostDetailModal 
          post={selectedPost} 
          onClose={() => setSelectedPost(null)} 
        />
      )}

      {isCreatePostOpen && (
        <CreatePostModal onClose={() => setIsCreatePostOpen(false)} onSuccess={handlePostSuccess} />
      )}
    </div>
  );
};

export default Explore;