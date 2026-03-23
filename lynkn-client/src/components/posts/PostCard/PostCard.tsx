// src/components/posts/PostCard/PostCard.tsx
import React from "react";
import { Heart, MessageCircle } from "lucide-react";
import "./PostCard.css";

interface PostCardProps {
  post: any;
  onClick: () => void; // Función que se ejecuta al hacer clic
}

const PostCard: React.FC<PostCardProps> = ({ post, onClick }) => {
  // Imagen de respaldo por si acaso
  const finalSrc = post.image_url || 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=300&auto=format&fit=crop';

  return (
    <div className="grid-post-card" onClick={onClick}>
      <img
        src={finalSrc}
        alt={post.title}
        className="post-card-image"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.src = 'https://images.unsplash.com/photo-1594322436404-5a0526db4d13?q=80&w=300&auto=format&fit=crop';
        }}
      />
      <div className="post-card-overlay">
        <div className="overlay-stats">
          <span><Heart size={20} fill="white" color="white" /> {post.likes || 0}</span>
          <span><MessageCircle size={20} fill="white" color="white" /> {post.comments || 0}</span>
        </div>
        <span className="post-card-title">{post.title}</span>
      </div>
    </div>
  );
};

export default PostCard;