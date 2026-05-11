import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
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
import EditProfileModal from "./EditProfileModal";
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
  user_id: number;
  title: string;
  description: string;
  image_url?: string;
  category: string;
  lat: number;
  lng: number;
  likes?: number;
  comments?: number;
  created_at?: string;
  max_particip?: number;
  status?: string;
  event_date?: string;
}

const Profile = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<"posts" | "map">("posts");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReverifyOpen, setIsReverifyOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const isDarkMode = localStorage.getItem("theme") !== "light";

  useEffect(() => {
    const fetchMyPosts = async () => {
      if (!user?.id) return;
      setIsLoading(true);
      try {
        const response = await api.get(`/posts/user/${user.id}`);
        setUserPosts(response.data);
      } catch {
        console.error("Error cargando posts");
      } finally {
        setIsLoading(false);
      }
    };
    fetchMyPosts();
  }, [user?.id]);

  if (!user)
    return (
      <div className="loading-full">
        <Loader2 className="spin" color="var(--text-main)" />
      </div>
    );

  const handlePhotoUpload = async (imageData: string) => {
    try {
      await api.post("/auth/reverify", {
        userId: user.id,
        imageBase64: imageData,
      });
      setIsReverifyOpen(false);
      window.location.reload();
    } catch {
      alert(t('profile.upload_error'));
    }
  };

  const handlePostSuccess = () => {
    setIsCreatePostOpen(false);
    window.location.reload();
  };

  return (
    <div className={`explore-container ${!isDarkMode ? 'light-mode' : ''}`}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        activePage="profile"
        onNewPostClick={() => setIsCreatePostOpen(true)}
      />

      <main className={`main-content ${isSidebarOpen ? "sidebar-active" : ""}`}>
        <header className="top-navbar">
          <button className="icon-btn menu-trigger" onClick={toggleSidebar} type="button">
            <Menu color={isDarkMode ? "white" : "black"} size={24} />
          </button>
          <div className="navbar-page-title">{t('nav.profile')}</div>
        </header>

        <div className="profile-page">
          <div className="profile-container">
            {user.status_verif === "rejected" && (
              <div className="profile-rejected-banner animate-in">
                <ShieldAlert size={24} color="#ff4444" />
                <div className="banner-text">
                  <strong>{t('profile.rejected_title')}</strong>
                  {user.verif_message ? (
                    <div className="admin-feedback-box">
                      <p className="feedback-label">{t('profile.admin_note')}</p>
                      <p className="feedback-content">"{user.verif_message}"</p>
                    </div>
                  ) : (
                    <p>{t('profile.rejected_desc')}</p>
                  )}
                </div>
                <button className="reverify-inline-btn" onClick={() => setIsReverifyOpen(true)}>
                  {t('profile.retry')}
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
              onReverifyClick={() => setIsReverifyOpen(true)}
            />

            <nav className="view-switcher">
              <button
                className={`switch-btn ${viewMode === "posts" ? "active" : ""}`}
                onClick={() => { setViewMode("posts"); setSelectedPost(null); }}
              >
                <Grid size={18} /> {t('profile.view_posts')}
              </button>
              <button
                className={`switch-btn ${viewMode === "map" ? "active" : ""}`}
                onClick={() => { setViewMode("map"); setSelectedPost(null); }}
              >
                <MapIcon size={18} /> {t('profile.view_map')}
              </button>
            </nav>

            <section className="profile-content-area">
              {isLoading ? (
                <div className="loading-posts">
                  <Loader2 className="spin" color="var(--text-main)" />
                </div>
              ) : userPosts.length > 0 ? (
                viewMode === "posts" ? (
                  <div className="posts-grid">
                    {userPosts.map((post) => (
                      <PostCard key={post.id} post={post} onClick={() => setSelectedPost(post)} />
                    ))}
                  </div>
                ) : (
                  <div className="profile-map-wrapper">
                    <ProfileMap posts={userPosts} onMarkerClick={setSelectedPost} />
                    {selectedPost && (
                      <div className="map-post-balloon-overlay" onClick={() => setSelectedPost(null)}>
                        <div className="map-post-balloon" onClick={(e) => e.stopPropagation()}>
                          <button className="balloon-close" onClick={() => setSelectedPost(null)}>
                            <X size={18} />
                          </button>
                          <div className="balloon-header">
                            <img src={user.foto_perfil} alt="avatar" />
                            <span>{user.username}</span>
                          </div>
                          <img src={selectedPost.image_url} className="balloon-img" alt="post map" />
                        </div>
                      </div>
                    )}
                  </div>
                )
              ) : (
                <div className="empty-posts-state">
                  <Camera size={48} color="var(--text-muted)" />
                  <h2>{t('profile.empty_posts')}</h2>
                  <p>{t('profile.empty_posts_desc')}</p>
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {selectedPost && viewMode === "posts" && (
        <PostDetailModal
          post={{
            ...selectedPost,
            id: Number(selectedPost.id),
            user_id: Number(selectedPost.user_id),
            image_url: selectedPost.image_url || "",
            event_date: selectedPost.event_date || "",
            max_particip: selectedPost.max_particip || 0,
          }}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={() => {
            setIsEditModalOpen(false);
            window.location.reload();
          }}
        />
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