import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map as MapIcon, LayoutList, Menu, Search, Filter, X } from "lucide-react";

import { useAuth } from "../../hooks/useAuth";
import Sidebar from "../../components/Sidebar";
import CreatePostModal from "../../components/posts/CreatePostModal";
import PostDetailModal from "../../components/posts/PostDetailModal/PostDetailModal";
import PostCard from "../../components/posts/PostCard/PostCard";
import api from "../../api/axiosConfig";
import { categoryService, getCategoryLabel } from "../../services/categoryService";
import type { EventCategory } from "../../types/category";
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
  favorite_count?: number;
  is_favorited?: boolean;
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

interface ProfileSearchResult {
  id: number;
  username: string;
  foto_perfil?: string;
  bio?: string;
  location?: string;
  followers?: number;
  is_following?: boolean;
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

const escapeHtml = (value?: string | number) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");

const Explore = () => {
  const { user, isSidebarOpen, setIsSidebarOpen, toggleSidebar } = useAuth();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [viewMode, setViewMode] = useState<"map" | "posts">("map");
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");
  const [capacityFilter, setCapacityFilter] = useState<"all" | "open" | "unlimited">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [profileResults, setProfileResults] = useState<ProfileSearchResult[]>([]);
  const [isProfileSearchLoading, setIsProfileSearchLoading] = useState(false);

  const isDarkMode = localStorage.getItem("theme") !== "light";

  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const markers = useRef<maplibregl.Marker[]>([]);
  const addressMarker = useRef<maplibregl.Marker | null>(null);

  const categoryMap = useMemo(() => new Map(categories.map((category) => [category.slug, category])), [categories]);

  const filteredPosts = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase();

    return posts.filter((post) => {
      const current = Math.floor(post.current_particip || 0);
      const max = Math.floor(post.max_particip || 0);
      const isUnlimited = max === 0;
      const hasOpenSpots = isUnlimited || current < max;
      const isFull = !isUnlimited && current >= max;
      const userStatus = post.userStatus || "available";
      const shouldHideFullPost = isFull && userStatus === "available";

      const matchesSearch =
        !normalizedSearch ||
        [
          post.title,
          post.description,
          post.category,
          getCategoryLabel(categoryMap.get(post.category), i18n.language),
          post.users?.username,
        ]
          .filter(Boolean)
          .some((value) => value.toLowerCase().includes(normalizedSearch));

      const matchesStatus =
        statusFilter === "all" || userStatus === statusFilter;

      const matchesCapacity =
        capacityFilter === "all" ||
        (capacityFilter === "open" && !isUnlimited && hasOpenSpots) ||
        (capacityFilter === "unlimited" && isUnlimited);

      const matchesCategory =
        categoryFilter === "all" || post.category === categoryFilter;

      return !shouldHideFullPost && matchesSearch && matchesStatus && matchesCapacity && matchesCategory;
    });
  }, [capacityFilter, categoryFilter, categoryMap, i18n.language, posts, searchQuery, statusFilter]);

  const activeFilterCount = [
    statusFilter !== "all",
    capacityFilter !== "all",
    categoryFilter !== "all",
  ].filter(Boolean).length;

  const hasActiveSearchOrFilters = Boolean(searchQuery.trim()) || activeFilterCount > 0;

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setCapacityFilter("all");
    setCategoryFilter("all");
  };

  useEffect(() => {
    const query = searchQuery.trim();
    if (!user?.id || query.length < 2) {
      setProfileResults([]);
      return;
    }

    const timer = window.setTimeout(async () => {
      setIsProfileSearchLoading(true);
      try {
        const response = await api.get<ProfileSearchResult[]>("/users/search", {
          params: { q: query, viewerId: user.id },
        });
        setProfileResults(response.data.filter((result) => Number(result.id) !== Number(user.id)));
      } catch (error) {
        console.error("Error buscando perfiles:", error);
      } finally {
        setIsProfileSearchLoading(false);
      }
    }, 260);

    return () => window.clearTimeout(timer);
  }, [searchQuery, user?.id]);

  const handleFollowFromSearch = async (profile: ProfileSearchResult) => {
    if (!user?.id) return;
    try {
      const response = profile.is_following
        ? await api.delete(`/users/${profile.id}/follow`, { params: { followerId: user.id } })
        : await api.post(`/users/${profile.id}/follow`, { followerId: user.id });

      setProfileResults((prev) => prev.map((item) => (
        item.id === profile.id
          ? {
              ...item,
              followers: response.data.followers,
              is_following: response.data.is_following,
            }
          : item
      )));
    } catch (error) {
      console.error("Error siguiendo perfil:", error);
    }
  };

  const updatePostFavoriteState = (postId: number, social: { favorite_count: number; is_favorited: boolean }) => {
    setPosts((prev) => prev.map((post) => (
      Number(post.id) === Number(postId)
        ? { ...post, favorite_count: social.favorite_count, is_favorited: social.is_favorited }
        : post
    )));
    setSelectedPost((prev) => (
      prev && Number(prev.id) === Number(postId)
        ? { ...prev, favorite_count: social.favorite_count, is_favorited: social.is_favorited }
        : prev
    ));
  };

  const handleFavoriteToggle = async (postId: number | string, nextFavorite: boolean) => {
    if (!user?.id) return;
    const numericPostId = Number(postId);
    const previousPost = posts.find((post) => Number(post.id) === numericPostId);

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
    categoryService.getCategories().then((data) => {
      if (isMounted) setCategories(data);
    });
    return () => { isMounted = false; };
  }, []);

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
    if (!map.current) return;

    markers.current.forEach((m) => m.remove());
    markers.current = [];

    filteredPosts.forEach((post) => {
      const el = document.createElement("div");
      el.className = `post-marker-neon status-${post.userStatus}`;

      if (post.image_url) el.style.backgroundImage = `url(${post.image_url})`;
      if (post.userStatus && post.userStatus !== "available") {
        const indicator = document.createElement("span");
        indicator.className = `marker-status-indicator ${post.userStatus}`;
        indicator.textContent = post.userStatus === "accepted" ? "✓" : post.userStatus === "rejected" ? "!" : "…";
        el.appendChild(indicator);
        el.setAttribute("aria-label", t(`post_card.status.${post.userStatus}`));
      }

      const popupImage = escapeHtml(
        post.image_url ||
          "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?q=80&w=500&auto=format&fit=crop",
      );
      const popupAvatar = escapeHtml(
        post.users?.foto_perfil ||
          "https://ui-avatars.com/api/?background=111827&color=fff&name=L",
      );
      const popupTitle = escapeHtml(post.title);
      const popupUsername = escapeHtml(post.users?.username || "LYNKN");
      const popupCategory = categoryMap.get(post.category);
      const popupCategoryLabel = escapeHtml(
        getCategoryLabel(popupCategory, i18n.language) || post.category || "General",
      );
      const popupCategoryColor = escapeHtml(popupCategory?.color || "#00f2ff");
      const popupStatus =
        post.userStatus && post.userStatus !== "available"
          ? escapeHtml(t(`post_card.status.${post.userStatus}`))
          : "";

      const marker = new maplibregl.Marker(el)
        .setLngLat([post.lng, post.lat])
        .setPopup(
          new maplibregl.Popup({
            offset: 25,
            className: "custom-popup-theme",
            closeButton: false,
            maxWidth: "280px",
          })
            .setHTML(`
            <div class="popup-card-explore">
              <div class="popup-author-row">
                <img class="popup-author-avatar" src="${popupAvatar}" alt="${popupUsername}" />
                <span class="popup-author-name">${popupUsername}</span>
              </div>
              <img class="popup-event-thumb" src="${popupImage}" alt="${popupTitle}" />
              <div class="popup-body-explore">
                <strong>${popupTitle}</strong>
                <span class="popup-category-chip" style="--popup-category-color: ${popupCategoryColor}">${popupCategoryLabel}</span>
                ${popupStatus ? `<span class="popup-status-chip status-label-${post.userStatus}">${popupStatus}</span>` : ""}
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
  }, [categoryMap, filteredPosts, i18n.language, viewMode, isDarkMode, t]);

  useEffect(() => {
    const query = searchQuery.trim();
    if (viewMode !== "map" || !map.current || query.length < 3) {
      addressMarker.current?.remove();
      addressMarker.current = null;
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=1&q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        const data: Array<{ lat: string; lon: string; display_name?: string }> = await response.json();
        const result = data[0];
        if (!result || !map.current) return;

        const lng = Number(result.lon);
        const lat = Number(result.lat);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        const markerNode = document.createElement("div");
        markerNode.className = "address-search-marker";
        markerNode.title = result.display_name || query;
        markerNode.innerHTML = '<span></span>';

        addressMarker.current?.remove();
        addressMarker.current = new maplibregl.Marker(markerNode)
          .setLngLat([lng, lat])
          .addTo(map.current);

        map.current.flyTo({ center: [lng, lat], zoom: 15, essential: true });
      } catch (error) {
        if ((error as DOMException).name !== "AbortError") {
          console.error("Error buscando dirección en Explorer:", error);
        }
      }
    }, 700);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [searchQuery, viewMode]);

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
            <input
              type="text"
              placeholder={t('explore.search_placeholder')}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={() => setSearchQuery("")}
                aria-label={t("explore.filters.clear_search")}
              >
                <X size={16} />
              </button>
            )}
            <button
              type="button"
              className={`filter-toggle-btn ${isFilterOpen ? "active" : ""}`}
              onClick={() => setIsFilterOpen((value) => !value)}
              aria-label={t("explore.filters.open")}
            >
              <Filter size={18} />
              {activeFilterCount > 0 && <span>{activeFilterCount}</span>}
            </button>
          </div>
        </header>

        {isFilterOpen && (
          <section className="explore-filter-panel">
            <div className="filter-group">
              <label>{t("explore.filters.status")}</label>
              <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
                <option value="all">{t("explore.filters.all")}</option>
                <option value="pending">{t("post_card.status.pending")}</option>
                <option value="accepted">{t("post_card.status.accepted")}</option>
                <option value="rejected">{t("post_card.status.rejected")}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t("explore.filters.capacity")}</label>
              <select value={capacityFilter} onChange={(event) => setCapacityFilter(event.target.value as typeof capacityFilter)}>
                <option value="all">{t("explore.filters.all")}</option>
                <option value="open">{t("explore.filters.open_spots")}</option>
                <option value="unlimited">{t("explore.filters.unlimited")}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t("explore.filters.category")}</label>
              <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
                <option value="all">{t("explore.filters.all")}</option>
                {categories.map((category) => (
                  <option key={category.slug} value={category.slug}>
                    {getCategoryLabel(category, i18n.language)}
                  </option>
                ))}
              </select>
            </div>

            <div className="category-filter-strip" aria-label={t("explore.filters.category")}>
              <button
                type="button"
                className={categoryFilter === "all" ? "active" : ""}
                onClick={() => setCategoryFilter("all")}
              >
                {t("explore.filters.all")}
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  key={category.slug}
                  className={categoryFilter === category.slug ? "active" : ""}
                  style={{ "--category-color": category.color } as React.CSSProperties}
                  onClick={() => setCategoryFilter(category.slug)}
                >
                  <span />
                  {getCategoryLabel(category, i18n.language)}
                </button>
              ))}
            </div>

            <button
              type="button"
              className="filter-reset-btn"
              onClick={clearFilters}
              disabled={!hasActiveSearchOrFilters}
            >
              {t("explore.filters.clear")}
            </button>
          </section>
        )}

        {searchQuery.trim().length >= 2 && (
          <section className="profile-search-panel">
            <header>
              <span>{t("explore.profile_search.title")}</span>
              {isProfileSearchLoading && <small>{t("common.loading")}</small>}
            </header>
            <div className="profile-search-results">
              {profileResults.length > 0 ? profileResults.map((profile) => (
                <article className="profile-search-card" key={profile.id}>
                  <button
                    type="button"
                    className="profile-search-main"
                    onClick={() => navigate(`/profile/${profile.id}`)}
                  >
                    <img src={profile.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.username}`} alt={profile.username} />
                    <div>
                      <strong>@{profile.username}</strong>
                      <span>{profile.bio || profile.location || t("profile.no_bio")}</span>
                    </div>
                  </button>
                  <button
                    type="button"
                    className={`profile-search-follow ${profile.is_following ? "following" : ""}`}
                    onClick={() => handleFollowFromSearch(profile)}
                  >
                    {profile.is_following ? t("profile.unfollow") : t("profile.follow")}
                  </button>
                </article>
              )) : !isProfileSearchLoading && (
                <p>{t("explore.profile_search.empty")}</p>
              )}
            </div>
          </section>
        )}

        <nav className="explore-mode-tabs" aria-label={t("explore.view_switch_label")}>
          <button
            className={`switch-nav-btn ${viewMode === "map" ? "active" : ""}`}
            onClick={() => setViewMode("map")}
            type="button"
          >
            <MapIcon size={18} /> {t('explore.btn_map')}
          </button>
          <button
            className={`switch-nav-btn ${viewMode === "posts" ? "active" : ""}`}
            onClick={() => setViewMode("posts")}
            type="button"
          >
            <LayoutList size={18} /> {t('explore.btn_posts')}
          </button>
        </nav>

        <section className={`view-area ${viewMode === "posts" ? "posts-view" : "map-view"} ${isLocked ? "locked" : ""}`}>
          <SecurityOverlay user={user} />

          {viewMode === "map" ? (
            <div ref={mapContainer} className="map-div" />
          ) : (
            <div className="explore-posts-grid">
              {filteredPosts.length > 0 ? filteredPosts.map((post) => (
                <PostCard
                  key={post.id}
                  post={post}
                  category={categoryMap.get(post.category)}
                  onFavoriteToggle={handleFavoriteToggle}
                  onClick={() => setSelectedPost(post)}
                />
              )) : (
                <div className="explore-empty-state">
                  <Search size={34} />
                  <h2>{t("explore.filters.empty_title")}</h2>
                  <p>{t("explore.filters.empty_desc")}</p>
                  {hasActiveSearchOrFilters && (
                    <button type="button" onClick={clearFilters}>
                      {t("explore.filters.clear")}
                    </button>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {selectedPost && (
        <PostDetailModal
          post={{
            ...selectedPost,
            user_id: selectedPost.user_id,
            event_date: selectedPost.event_date || "",
            max_particip: selectedPost.max_particip || 0,
          }}
          category={categoryMap.get(selectedPost.category)}
          onFavoriteChange={(social) => updatePostFavoriteState(selectedPost.id, social)}
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
