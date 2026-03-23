import { MapPin } from "lucide-react";
import "./ProfileHeader.css";

// Definimos la interfaz
interface ProfileHeaderProps {
  user: {
    username: string;
    foto_perfil: string; 
    bio?: string;
    location?: string;
    status_verif?: string; 
    stats?: {
      posts: number | string;
      followers: number | string;
      following: number | string;
    };
  };
  onEditClick: () => void;
}

const ProfileHeader = ({ user, onEditClick }: ProfileHeaderProps) => {
  return (
    <header className="profile-header">
      <div className="avatar-section">
        <div className="avatar-wrapper">
          <img 
            src={user.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} 
            alt={`Avatar de ${user.username}`} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`;
            }}
          />
        </div>
      </div>
      
      <section className="info-section">
        <div className="username-row">
          <h1>{user.username}</h1>
          <div className="action-buttons">
            <button className="edit-profile-action-btn" onClick={onEditClick}>
              Editar perfil
            </button>
          </div>
        </div>
        
        <div className="stats-row">
          <span><strong>{user.stats?.posts ?? 0}</strong> posts</span>
          <span><strong>{user.stats?.followers ?? 0}</strong> seguidores</span>
          <span><strong>{user.stats?.following ?? 0}</strong> seguidos</span>
        </div>
        
        <div className="bio-row">
          <span className="name">{user.username}</span>
          <p className="bio-text">{user.bio || "Sin biografía aún..."}</p>
          <div className="location">
            <MapPin size={14} /> 
            <span>{user.location || "Ubicación no especificada"}</span>
          </div>
        </div>
      </section>
    </header>
  );
};

export default ProfileHeader;