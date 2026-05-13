import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  Grid,
  Map as MapIcon,
  X,
  Menu,
  ShieldAlert,
  Camera,
  Loader2,
  Heart,
} from "lucide-react";
import { toast } from "sonner";
import "./Profile.css";
import EditProfileModal from "./EditProfileModal";
import ProfileMap from "./ProfileMap";
import ProfileHeader from "./ProfileHeader";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import ReverifyModal from "./ReverifyModal";
import PostCard from "../../components/posts/PostCard/PostCard";
import PostDetailModal from "../../components/posts/PostDetailModal/PostDetailModal";
import { categoryService } from "../../services/categoryService";
import type { EventCategory } from "../../types/category";

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
  favorite_count?: number;
  is_favorited?: boolean;
  created_at?: string;
  max_particip?: number;
  status?: string;
  event_date?: string;
}

const Profile = () => {
  const { profileId } = useParams();
  const { user, updateUser, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const { t } = useTranslation();

  const [viewMode, setViewMode] = useState<"posts" | "favorites" | "map">("posts");
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isReverifyOpen, setIsReverifyOpen] = useState(false);
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);

  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [favoritePosts, setFavoritePosts] = useState<Post[]>([]);
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [profileUser, setProfileUser] = useState<typeof user | null>(user);
  const [socialStats, setSocialStats] = useState({ followers: 0, following: 0, is_following: false });
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);
  const [followList, setFollowList] = useState<Array<{
    id: number;
    username: string;
    foto_perfil?: string;
    bio?: string;
    is_following?: boolean;
  }>>([]);
  const [isFollowListLoading, setIsFollowListLoading] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isDarkMode = localStorage.getItem("theme") !== "light";
  const viewedUserId = profileId || user?.id;
  const isOwnProfile = !profileId || Number(profileId) === Number(user?.id);

  useEffect(() => {
    let isMounted = true;
    categoryService.getCategories().then((data) => {
      if (isMounted) setCategories(data);
    });
    return () => { isMounted = false; };
  }, []);

  const getPostCategory = (slug?: string) => categories.find((category) => category.slug === slug);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!viewedUserId || !user?.id) return;
      setIsLoading(true);
      try {
        const [profileResponse, postsResponse, favoritesResponse, socialResponse] = await Promise.all([
          isOwnProfile ? Promise.resolve({ data: user }) : api.get(`/users/${viewedUserId}`),
          api.get(`/posts/user/${viewedUserId}`, { params: { viewerId: user.id } }),
          isOwnProfile ? api.get(`/posts/favorites/${user.id}`) : Promise.resolve({ data: [] }),
          api.get(`/users/${viewedUserId}/social`, { params: { viewerId: user.id } }),
        ]);
        setProfileUser(profileResponse.data);
        setUserPosts(postsResponse.data);
        setFavoritePosts(favoritesResponse.data);
        setSocialStats(socialResponse.data);
      } catch {
        console.error("Error cargando perfil");
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfileData();
  }, [isOwnProfile, user, user?.id, viewedUserId]);

  const loadFollowList = async (type: "followers" | "following") => {
    if (!viewedUserId || !user?.id) return;
    setFollowModal(type);
    setIsFollowListLoading(true);
    try {
      const response = await api.get(`/users/${viewedUserId}/${type}`, {
        params: { viewerId: user.id },
      });
      setFollowList(response.data);
    } catch {
      toast.error(t("common.error"));
    } finally {
      setIsFollowListLoading(false);
    }
  };

  const handleFollowProfile = async () => {
    if (!user?.id || !profileUser?.id) return;
    try {
      const response = socialStats.is_following
        ? await api.delete(`/users/${profileUser.id}/follow`, { params: { followerId: user.id } })
        : await api.post(`/users/${profileUser.id}/follow`, { followerId: user.id });
      setSocialStats(response.data);
    } catch {
      toast.error(t("common.error"));
    }
  };

  const handleUnfollowFromList = async (targetUserId: number) => {
    if (!user?.id) return;
    try {
      await api.delete(`/users/${targetUserId}/follow`, { params: { followerId: user.id } });
      setFollowList((prev) => prev.map((item) => (
        Number(item.id) === Number(targetUserId) ? { ...item, is_following: false } : item
      )));
      if (Number(targetUserId) === Number(profileUser?.id)) {
        const response = await api.get(`/users/${targetUserId}/social`, { params: { viewerId: user.id } });
        setSocialStats(response.data);
      }
    } catch {
      toast.error(t("common.error"));
    }
  };

  if (!user || !profileUser)
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
      toast.error(t('profile.upload_error'));
    }
  };

  const handlePostSuccess = () => {
    setIsCreatePostOpen(false);
    window.location.reload();
  };

  const updatePostFavoriteState = (postId: number | string, social: { favorite_count: number; is_favorited: boolean }) => {
    setUserPosts((prev) => prev.map((post) => (
      Number(post.id) === Number(postId)
        ? { ...post, favorite_count: social.favorite_count, is_favorited: social.is_favorited }
        : post
    )));
    setFavoritePosts((prev) => {
      const updated = prev.map((post) => (
        Number(post.id) === Number(postId)
          ? { ...post, favorite_count: social.favorite_count, is_favorited: social.is_favorited }
          : post
      ));
      return social.is_favorited ? updated : updated.filter((post) => Number(post.id) !== Number(postId));
    });
    setSelectedPost((prev) => (
      prev && Number(prev.id) === Number(postId)
        ? { ...prev, favorite_count: social.favorite_count, is_favorited: social.is_favorited }
        : prev
    ));
  };

  const handleFavoriteToggle = async (postId: number | string, nextFavorite: boolean) => {
    if (!user?.id) return;
    const numericPostId = Number(postId);
    const previousPost = [...userPosts, ...favoritePosts].find((post) => Number(post.id) === numericPostId);

    updatePostFavoriteState(numericPostId, {
      favorite_count: Math.max(0, (previousPost?.favorite_count || 0) + (nextFavorite ? 1 : -1)),
      is_favorited: nextFavorite,
    });

    try {
      const response = nextFavorite
        ? await api.post(`/posts/${numericPostId}/favorite`, { userId: user.id })
        : await api.delete(`/posts/${numericPostId}/favorite`, { params: { userId: user.id } });
      updatePostFavoriteState(numericPostId, response.data);
    } catch (error) {
      console.error("Error updating favorite:", error);
      if (previousPost) {
        updatePostFavoriteState(numericPostId, {
          favorite_count: previousPost.favorite_count || 0,
          is_favorited: Boolean(previousPost.is_favorited),
        });
      }
    }
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
            {isOwnProfile && user.status_verif === "rejected" && (
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
                ...profileUser,
                foto_perfil: profileUser.foto_perfil || "",
                stats: {
                  posts: userPosts.length,
                  followers: socialStats.followers,
                  following: socialStats.following,
                },
              }}
              isOwnProfile={isOwnProfile}
              isFollowing={socialStats.is_following}
              onEditClick={() => setIsEditModalOpen(true)}
              onReverifyClick={() => setIsReverifyOpen(true)}
              onFollowClick={handleFollowProfile}
              onFollowersClick={() => loadFollowList("followers")}
              onFollowingClick={() => loadFollowList("following")}
            />

            <nav className="view-switcher">
              <button
                className={`switch-btn ${viewMode === "posts" ? "active" : ""}`}
                onClick={() => { setViewMode("posts"); setSelectedPost(null); }}
              >
                <Grid size={18} /> {t('profile.view_posts')}
              </button>
              <button
                className={`switch-btn ${viewMode === "favorites" ? "active" : ""}`}
                onClick={() => { setViewMode("favorites"); setSelectedPost(null); }}
                hidden={!isOwnProfile}
              >
                <Heart size={18} /> {t('profile.view_favorites')}
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
              ) : viewMode === "posts" ? (
                userPosts.length > 0 ? (
                  <div className="posts-grid">
                    {userPosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        category={getPostCategory(post.category)}
                        onFavoriteToggle={handleFavoriteToggle}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-posts-state">
                    <Camera size={48} color="var(--text-muted)" />
                    <h2>{t('profile.empty_posts')}</h2>
                    <p>{t('profile.empty_posts_desc')}</p>
                  </div>
                )
              ) : viewMode === "favorites" ? (
                favoritePosts.length > 0 ? (
                  <div className="posts-grid">
                    {favoritePosts.map((post) => (
                      <PostCard
                        key={post.id}
                        post={post}
                        category={getPostCategory(post.category)}
                        onFavoriteToggle={handleFavoriteToggle}
                        onClick={() => setSelectedPost(post)}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="empty-posts-state">
                    <Heart size={48} color="var(--text-muted)" style={{ opacity: 0.35 }} />
                    <h2>{t('profile.empty_favorites')}</h2>
                    <p>{t('profile.empty_favorites_desc')}</p>
                  </div>
                )
              ) : userPosts.length > 0 ? (
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
                          <span>{profileUser.username}</span>
                        </div>
                        <img src={selectedPost.image_url} className="balloon-img" alt="post map" />
                      </div>
                    </div>
                  )}
                </div>
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

      {selectedPost && viewMode !== "map" && (
        <PostDetailModal
          post={{
            ...selectedPost,
            id: Number(selectedPost.id),
            user_id: Number(selectedPost.user_id),
            image_url: selectedPost.image_url || "",
            event_date: selectedPost.event_date || "",
            max_particip: selectedPost.max_particip || 0,
          }}
          category={getPostCategory(selectedPost.category)}
          onFavoriteChange={(social) => updatePostFavoriteState(selectedPost.id, social)}
          onClose={() => setSelectedPost(null)}
        />
      )}

      {isEditModalOpen && (
        <EditProfileModal
          user={user}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updatedUser) => {
            updateUser(updatedUser);
            setIsEditModalOpen(false);
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

      {followModal && (
        <div className="modal-overlay blur" onClick={() => setFollowModal(null)}>
          <section className="follow-modal" onClick={(event) => event.stopPropagation()}>
            <header>
              <h3>{followModal === "followers" ? t("profile.followers") : t("profile.following")}</h3>
              <button className="close-btn" onClick={() => setFollowModal(null)}><X size={18} /></button>
            </header>
            <div className="follow-list">
              {isFollowListLoading ? (
                <div className="loading-posts"><Loader2 className="spin" color="var(--text-main)" /></div>
              ) : followList.length > 0 ? followList.map((item) => (
                <article className="follow-list-item" key={item.id}>
                  <img src={item.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.username}`} alt={item.username} />
                  <a href={`/profile/${item.id}`}>
                    <strong>@{item.username}</strong>
                    <span>{item.bio || t("profile.no_bio")}</span>
                  </a>
                  {Number(item.id) !== Number(user.id) && item.is_following && (
                    <button type="button" onClick={() => handleUnfollowFromList(item.id)}>
                      {t("profile.unfollow_action")}
                    </button>
                  )}
                </article>
              )) : (
                <p className="follow-empty">{t("profile.empty_follow_list")}</p>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;
