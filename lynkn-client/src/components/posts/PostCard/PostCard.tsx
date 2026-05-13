import React from "react";
import { Heart, MessageCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth"; 
import { getCategoryLabel } from "../../../services/categoryService";
import type { EventCategory } from "../../../types/category";
import "./PostCard.css";

interface Post {
  id: number | string;
  user_id: number; 
  title: string;
  image_url?: string;
  likes?: number;
  comments?: number;
  max_particip?: number;
  current_particip?: number;
  category?: string;
  favorite_count?: number;
  is_favorited?: boolean;
  userStatus?: "available" | "pending" | "accepted" | "rejected";
}

interface PostCardProps {
  post: Post;
  category?: EventCategory;
  onClick: () => void;
  onFavoriteToggle?: (postId: number | string, nextFavorite: boolean) => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, category, onClick, onFavoriteToggle }) => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const placeholderImg = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop';
  const finalSrc = post.image_url || placeholderImg;
  
  const isUnlimited = post.max_particip === 0 || !post.max_particip;
  const isOwner = user?.id === post.user_id;
  
  const current = Math.floor(post.current_particip || 0);
  const max = Math.floor(post.max_particip || 1);
  const percentage = isUnlimited ? 0 : Math.min(100, Math.floor((current / max) * 100));

  const renderStatusIcon = () => {
    switch (post.userStatus) {
      case "pending": return <Clock size={14} />;
      case "accepted": return <CheckCircle2 size={14} />;
      case "rejected": return <XCircle size={14} />;
      default: return null;
    }
  };

  const handleFavoriteClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    onFavoriteToggle?.(post.id, !post.is_favorited);
  };

  return (
    <div className={`grid-post-card status-${post.userStatus || 'available'}`} onClick={onClick}>
      <div className="post-card-image-container">
        <img
          src={finalSrc}
          alt={post.title}
          className="post-card-image"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.src = placeholderImg;
          }}
        />
      </div>
      
      {post.userStatus && post.userStatus !== "available" && !isOwner && (
        <div className={`post-status-badge ${post.userStatus}`}>
          {renderStatusIcon()}
          <span>{t(`post_card.status.${post.userStatus}`)}</span>
        </div>
      )}

      {isUnlimited && (!post.userStatus || post.userStatus === "available") && !isOwner && (
        <div className="unlimited-badge-mini">{t('post_card.unlimited')}</div>
      )}

      {category && (
        <div
          className="post-category-badge"
          style={{ "--category-color": category.color } as React.CSSProperties}
        >
          <span />
          {getCategoryLabel(category, i18n.language)}
        </div>
      )}

      {onFavoriteToggle && (
        <button
          type="button"
          className={`post-favorite-btn ${post.is_favorited ? "active" : ""}`}
          onClick={handleFavoriteClick}
          aria-label={post.is_favorited ? t("post_card.favorite_remove") : t("post_card.favorite_add")}
        >
          <Heart size={16} fill={post.is_favorited ? "currentColor" : "none"} />
          <span>{post.favorite_count || 0}</span>
        </button>
      )}

      <div className="post-card-overlay">
        <div className="overlay-stats">
          <div className="stat-group">
            <div className="stat-item">
              <Heart size={14} fill="white" color="white" /> 
              <span>{post.favorite_count ?? post.likes ?? 0}</span>
            </div>
            <div className="stat-item">
              <MessageCircle size={14} fill="white" color="white" /> 
              <span>{post.comments || 0}</span>
            </div>
          </div>
          
          {!isUnlimited && (
            <div className="card-progress-wrapper">
              <div className="progress-text">
                <span className="current-count">{current}/{max}</span>
                <span className="percentage-val">{percentage}%</span>
              </div>
              <div className="progress-bar-bg">
                <div 
                  className="progress-bar-fill" 
                  style={{ 
                    width: `${percentage}%`,
                    backgroundColor: percentage > 90 ? '#ef4444' : percentage > 60 ? '#f59e0b' : '#00f2ff'
                  }}
                />
              </div>
            </div>
          )}
        </div>
        <span className="post-card-title">{post.title}</span>
      </div>
    </div>
  );
};

export default PostCard;
