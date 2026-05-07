import React from "react";
import { Heart, MessageCircle, Clock, CheckCircle2, XCircle } from "lucide-react";
import "./PostCard.css";

interface Post {
  id: number | string;
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
  const placeholderImg = 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=400&auto=format&fit=crop';
  const finalSrc = post.image_url || placeholderImg;
  
  const isUnlimited = post.max_particip === 0 || !post.max_particip;
  
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
      
      {post.userStatus && post.userStatus !== "available" && (
        <div className={`post-status-badge ${post.userStatus}`}>
          {renderStatusIcon()}
          <span>{post.userStatus.toUpperCase()}</span>
        </div>
      )}

      {isUnlimited && (!post.userStatus || post.userStatus === "available") && (
        <div className="unlimited-badge-mini">ILIMITADO</div>
      )}

      <div className="post-card-overlay">
        <div className="overlay-stats">
          <div className="stat-item">
            <Heart size={16} fill="white" color="white" /> 
            <span>{post.likes || 0}</span>
          </div>
          <div className="stat-item">
            <MessageCircle size={16} fill="white" color="white" /> 
            <span>{post.comments || 0}</span>
          </div>
          
          <span className="stats-plazas">
            {isUnlimited ? "Ilimitado" : `${post.current_particip || 0}/${post.max_particip}`}
          </span>
        </div>
        <span className="post-card-title">{post.title}</span>
      </div>
    </div>
  );
};

export default PostCard;