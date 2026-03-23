import React, { useState, useEffect } from "react";
import {
  Grid,
  Map as MapIcon,
  X,
  Menu,
  ShieldAlert,
  Camera,
  Loader2,
} from "lucide-react";
import "./Profile.css";
import ProfileMap from "./ProfileMap";
import ProfileHeader from "./ProfileHeader";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import ReverifyModal from "./ReverifyModal";
import PostCard from "../../components/posts/PostCard/PostCard";
import PostDetailModal from "../../components/posts/PostDetailModal/PostDetailModal";

import api from "../../api/axiosConfig";
import { useAuth } from "../../hooks/useAuth";

export interface Post {
  id: string;
  title: string;
  description: string;
  image_url?: string;
  category: string;
  lat: number;
  lng: number;
  user_id: string;
  likes?: number;
  comments?: number;
  created_at?: string;
  max_particip?: number;
  status?: string;
}

const Profile = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();

  const [viewMode, setViewMode] = useState<"posts" | "map">("posts");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReverifyOpen, setIsReverifyOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    username: user?.username || "",
    bio: user?.bio || "",
    location: user?.location || "",
    foto_perfil: user?.foto_perfil || "",
  });

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/posts/user/${user.id}`);
        setUserPosts(response.data);
      } catch (error) {
        console.error("Error cargando posts:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyPosts();
  }, [user?.id]);

  if (!user)
    return (
      <div className="loading-full">
        <Loader2 className="spin" />
      </div>
    );

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await api.put(`/users/${user.id}/profile`, formData);
      setIsEditModalOpen(false);
      window.location.reload();
    } catch (error) {
      alert("Error al guardar cambios.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePhotoUpload = async (imageData: string) => {
    try {
      await api.post("/auth/reverify", {
        userId: user.id,
        imageBase64: imageData,
      });
      setIsReverifyOpen(false);
      window.location.reload();
    } catch (error) {
      alert("Error al subir la verificación.");
    }
  };

  const handlePostSuccess = () => {
    setIsCreatePostOpen(false);
    window.location.reload();
  };

  return (
    <div className="explore-container">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="profile"
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
          <div className="navbar-page-title">MI PERFIL</div>
        </header>

        <div className="profile-page">
          <div className="profile-container">
            {user.status_verif === "rejected" && (
              <div className="profile-rejected-banner">
                <ShieldAlert size={24} color="#ff4444" />
                <div className="banner-text">
                  <strong>VERIFICACIÓN RECHAZADA</strong>
                  <p>Sube una nueva selfie para activar tu cuenta.</p>
                </div>
                <button
                  className="reverify-inline-btn"
                  onClick={() => setIsReverifyOpen(true)}
                >
                  SUBIR SELFIE
                </button>
              </div>
            )}

            <ProfileHeader
              user={{
                ...user,
                stats: {
                  posts: userPosts.length,
                  followers: "0",
                  following: "0",
                },
              }}
              onEditClick={() => setIsEditModalOpen(true)}
            />

            <nav className="view-switcher">
              <button
                className={`switch-btn ${viewMode === "posts" ? "active" : ""}`}
                onClick={() => {
                  setViewMode("posts");
                  setSelectedPost(null);
                }}
              >
                <Grid size={18} /> POSTS
              </button>
              <button
                className={`switch-btn ${viewMode === "map" ? "active" : ""}`}
                onClick={() => {
                  setViewMode("map");
                  setSelectedPost(null);
                }}
              >
                <MapIcon size={18} /> MAPA
              </button>
            </nav>

            <section className="profile-content-area">
              {isLoading ? (
                <div className="loading-posts">
                  <Loader2 className="spin" />
                </div>
              ) : userPosts.length > 0 ? (
                viewMode === "posts" ? (
                  <div className="posts-grid">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="profile-map-wrapper">
                    <ProfileMap
                      posts={userPosts}
                      onMarkerClick={setSelectedPost}
                    />
                    {selectedPost && (
                      <div
                        className="map-post-balloon-overlay"
                        onClick={() => setSelectedPost(null)}
                      >
                        <div
                          className="map-post-balloon"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            className="balloon-close"
                            onClick={() => setSelectedPost(null)}
                          >
                            <X size={18} />
                          </button>
                          <div className="balloon-header">
                            <img src={user.foto_perfil} alt="avatar" />
                            <span>{user.username}</span>
                          </div>
                          <img
                            src={selectedPost.image_url}
                            className="balloon-img"
                            alt="post map"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="empty-posts-state">
                  <Camera size={48} />
                  <h2>Aún no hay publicaciones</h2>
                  <p>Tus capturas aparecerán aquí.</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {selectedPost && viewMode === "posts" && (
        <PostDetailModal
          post={selectedPost}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {isEditModalOpen && (
        <div
          className="modal-overlay blur"
          onClick={() => setIsEditModalOpen(false)}
        >
          <div
            className="edit-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="edit-modal-header">
              <h3>EDITAR PERFIL</h3>
              <button
                className="close-btn"
                onClick={() => setIsEditModalOpen(false)}
              >
                <X size={20} />
              </button>
            </div>
            <form className="edit-form" onSubmit={handleSaveProfile}>
              <div className="form-group">
                <label>NOMBRE DE USUARIO</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    setFormData({ ...formData, username: e.target.value })
                  }
                />
              </div>
              <button type="submit" className="save-btn" disabled={isSaving}>
                GUARDAR
              </button>
            </form>
          </div>
        </div>
      )}

      {isCreatePostOpen && (
        <CreatePostModal
          onClose={() => setIsCreatePostOpen(false)}
          onSuccess={handlePostSuccess}
        />
      )}

      {isReverifyOpen && (
        <ReverifyModal
          onClose={() => setIsReverifyOpen(false)}
          onUpload={handlePhotoUpload}
        />
      )}
    </div>
  );
};

export default Profile;