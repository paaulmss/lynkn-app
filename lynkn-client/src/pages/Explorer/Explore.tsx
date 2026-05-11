import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapIcon, LayoutList, Menu, Search, Filter } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import PostDetailModal from "../../components/posts/PostDetailModal/PostDetailModal";
import PostCard from "../../components/posts/PostCard/PostCard";
import api from "../../api/axiosConfig";
import "./Explore.css";

interface Post {
  id: number;
  title: string;
  description: string;
  image_url: string;
  lat: number;
  lng: number;
  category: string;
  user_id: number;
  max_particip?: number;
  current_particip?: number;
  event_date?: string;
  users: {
    username: string;
    foto_perfil: string;
  };
  userStatus?: "available" | "pending" | "accepted" | "rejected";
}

interface UserRequest {
  id: number;
  post_id: number;
  status: "pending" | "accepted" | "rejected";
}

interface UserData {
  id: string | number;
  email: string;
  username: string;
  role: "admin" | "user";
  status_verif: "pending" | "approved" | "rejected" | "unverified";
  foto_perfil?: string;
}

const SecurityOverlay = ({ user }: { user: UserData | null }) => {
  const { t } = useTranslation();
  const isAccessGranted =
    user?.role === "admin" || user?.status_verif === "approved";
  if (!user || isAccessGranted) return null;

  return (
    <div className="security-lock-overlay">
      <div className="lock-content">
        {user.status_verif === "pending" ? (
          <>
            <h2>{t('explore.security.pending_title')}</h2>
            <p>{t('explore.security.pending_desc')}</p>
          </>
        ) : (
          <>
            <h2>{t('explore.security.denied_title')}</h2>
            <p>{t('explore.security.denied_desc')}</p>
            <button
              className="reverify-btn"
              onClick={() => (window.location.href = "/profile")}
            >
              {t('explore.security.reverify')}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

const Explore = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<"map" | "posts">("map");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const isDarkMode = localStorage.getItem("theme") !== "light";

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);

  const fetchPostsAndStatus = useCallback(async () => {
    const currentUserId = user?.id;
    if (!currentUserId) return;

    try {
      const [postsRes, requestsRes] = await Promise.all([
        api.get<Post[]>(`/posts?exclude=${currentUserId}`),
        api.get<UserRequest[]>(`/posts/user-requests/${currentUserId}`),
      ]);

      const enrichedPosts = postsRes.data.map((post) => {
        const myRequest = requestsRes.data.find((r) => r.post_id === post.id);
        return {
          ...post,
          userStatus: myRequest ? myRequest.status : ("available" as const),
        };
      });

      setPosts(enrichedPosts);
    } catch (error) {
      console.error("Error al cargar datos enriquecidos:", error);
    }
  }, [user]);

  useEffect(() => {
    let isMounted = true;
    if (user?.id) {
      const load = async () => {
        if (isMounted) await fetchPostsAndStatus();
      };
      load();
    }
    return () => { isMounted = false; };
  }, [fetchPostsAndStatus, user?.id]);

  useEffect(() => {
    if (viewMode !== "map" || !mapContainer.current) return;

    const API_KEY = import.meta.env.VITE_STADIA_API_KEY;
    
    const styleName = isDarkMode ? "alidade_smooth_dark" : "alidade_smooth";
    const mapStyle = `https://tiles.stadiamaps.com/styles/${styleName}.json${API_KEY ? `?api_key=${API_KEY}` : ""}`;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: [-3.7037, 40.4167],
      zoom: 12,
      attributionControl: false,
    });

    map.current.addControl(
      new maplibregl.NavigationControl({ showCompass: false }),
      "bottom-right",
    );

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, [viewMode, isDarkMode]);

  useEffect(() => {
    if (!map.current || posts.length === 0) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    posts.forEach((post) => {
      const el = document.createElement("div");
      el.className = `post-marker-neon status-${post.userStatus}`;

      if (post.image_url) el.style.backgroundImage = `url(${post.image_url})`;

      const marker = new maplibregl.Marker(el)
        .setLngLat([post.lng, post.lat])
        .setPopup(
          new maplibregl.Popup({ offset: 25, className: "custom-popup-theme" })
            .setHTML(`
            <div class="popup-card-explore">
              <img src="${post.image_url}" alt="${post.title}" />
              <div class="popup-body-explore">
                <strong>${post.title}</strong>
                <span class="status-label-${post.userStatus}">${post.userStatus === "available" ? "" : post.userStatus?.toUpperCase()}</span>
                <button class="popup-view-btn" id="btn-${post.id}">${t('explore.details_btn')}</button>
              </div>
            </div>
          `),
        )
        .addTo(map.current!);

      marker.getPopup().on("open", () => {
        const btn = document.getElementById(`btn-${post.id}`);
        btn?.addEventListener("click", () => setSelectedPost(post));
      });

      markers.current.push(marker);
    });
  }, [posts, viewMode, isDarkMode, t]);

  useEffect(() => {
    const timer = setTimeout(() => map.current?.resize(), 300);
    return () => clearTimeout(timer);
  }, [isSidebarOpen]);

  const isLocked = user?.role !== "admin" && user?.status_verif !== "approved";

  return (
    <div className={`explore-container ${!isDarkMode ? 'light-mode' : ''}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="explore"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main className={`main-content explore-view ${isSidebarOpen ? "sidebar-active" : ""}`}>
        <header className="top-navbar">
          <button
            className="icon-btn menu-trigger"
            onClick={toggleSidebar}
            type="button"
          >
            <Menu color={isDarkMode ? "white" : "black"} size={24} />
          </button>
          <div className="search-bar">
            <Search size={18} color="var(--text-muted)" />
            <input type="text" placeholder={t('explore.search_placeholder')} />
            <Filter size={18} color="var(--text-muted)" />
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
          <button
            className={`switch-nav-btn ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
          >
            <MapIcon size={18} /> {t('explore.btn_map')}
          </button>
          <button
            className={`switch-nav-btn ${viewMode === "posts" ? "active" : ""}`}
            onClick={() => setViewMode("posts")}
          >
            <LayoutList size={18} /> {t('explore.btn_posts')}
          </button>
        </div>
      </main>

      {selectedPost && (
        <PostDetailModal
          post={{
            ...selectedPost,
            user_id: selectedPost.user_id,
            event_date: selectedPost.event_date || "",
            max_particip: selectedPost.max_particip || 0,
          }}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={fetchPostsAndStatus}
        />
      )}
    </div>
  );
};

export default Explore;