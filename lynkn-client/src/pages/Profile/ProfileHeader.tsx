import { useTranslation } from "react-i18next";
import { MapPin, Camera, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import "./ProfileHeader.css";

interface ProfileHeaderProps {
  user: {
    id?: string | number;
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
  isOwnProfile?: boolean;
  isFollowing?: boolean;
  onEditClick?: () => void;
  onReverifyClick?: () => void;
  onFollowClick?: () => void;
  onFollowersClick?: () => void;
  onFollowingClick?: () => void;
}

const ProfileHeader = ({
  user,
  isOwnProfile = true,
  isFollowing = false,
  onEditClick,
  onReverifyClick,
  onFollowClick,
  onFollowersClick,
  onFollowingClick,
}: ProfileHeaderProps) => {
  const { t } = useTranslation();
  const isDarkMode = localStorage.getItem("theme") !== "light";

  const renderVerificationBadge = () => {
    switch (user.status_verif) {
      case "approved":
        return <div className="verif-badge approved"><CheckCircle2 size={14} /> {t("profile.verified")}</div>;
      case "pending":
        return <div className="verif-badge pending"><Clock size={14} /> {t("profile.in_review")}</div>;
      case "rejected":
        return <div className="verif-badge rejected"><AlertCircle size={14} /> {t("profile.rejected")}</div>;
      default:
        return null;
    }
  };

  return (
    <header className={`profile-header-component ${!isDarkMode ? "light-mode" : ""}`}>
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
          <h1 className="profile-username">{user.username}</h1>
          <div className="action-buttons">
            {isOwnProfile ? (
              <>
                <button className="edit-profile-action-btn" onClick={onEditClick}>
                  {t("profile.edit_btn")}
                </button>

                {(user.status_verif === "unverified" || user.status_verif === "rejected" || !user.status_verif) && (
                  <button className="reverify-action-btn" onClick={onReverifyClick}>
                    <Camera size={16} />
                    <span>
                      {user.status_verif === "rejected"
                        ? t("profile.reverify_btn")
                        : t("profile.upload_selfie")}
                    </span>
                  </button>
                )}
              </>
            ) : (
              <button
                className={`follow-action-btn ${isFollowing ? "following" : ""}`}
                onClick={onFollowClick}
              >
                {isFollowing ? t("profile.unfollow") : t("profile.follow")}
              </button>
            )}
          </div>
        </div>

        <div className="verification-status-row">
          {renderVerificationBadge()}
        </div>

        <div className="stats-row">
          <div className="stat-item"><strong>{user.stats?.posts ?? 0}</strong> {t("profile.posts")}</div>
          <button type="button" className="stat-item stat-button" onClick={onFollowersClick}>
            <strong>{user.stats?.followers ?? 0}</strong> {t("profile.followers")}
          </button>
          <button type="button" className="stat-item stat-button" onClick={onFollowingClick}>
            <strong>{user.stats?.following ?? 0}</strong> {t("profile.following")}
          </button>
        </div>

        <div className="bio-row">
          <span className="display-name">{user.username}</span>
          <p className="bio-text">{user.bio || t("profile.no_bio")}</p>
          <div className="location-tag">
            <MapPin size={14} color="var(--text-muted)" />
            <span>{user.location || t("profile.no_location")}</span>
          </div>
        </div>
      </section>
    </header>
  );
};

export default ProfileHeader;
