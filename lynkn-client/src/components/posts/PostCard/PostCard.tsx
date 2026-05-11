import React from "react";
import { Heart, MessageCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../hooks/useAuth"; 
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
  userStatus?: "available" | "pending" | "accepted" | "rejected";
}

interface PostCardProps {
  post: Post;
  onClick: () => void;
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  const { user } = useAuth();
  const { t } = useTranslation();

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

      <div className="post-card-overlay">
        <div className="overlay-stats">
          <div className="stat-group">
            <div className="stat-item">
              <Heart size={14} fill="white" color="white" /> 
              <span>{post.likes || 0}</span>
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