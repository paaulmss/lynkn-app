import React from "react";
import { useTranslation } from "react-i18next";
import {
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es, enUS } from "date-fns/locale";
import "./NotificationItem.css";

interface NotificationData {
  id: number;
  type: 'join_request' | 'accepted' | 'rejected' | 'info_pending' | 'post_deleted' | 'kicked';
  is_read: boolean;
  created_at: string;
  sender?: {
    username: string;
    foto_perfil: string;
  };
  posts?: {
    title: string;
  };
}

interface NotifProps {
  notification: NotificationData;
}

const NotificationItem: React.FC<NotifProps> = ({ notification }) => {
  const { t, i18n } = useTranslation();
  const isDarkMode = localStorage.getItem("theme") !== "light";

  const dateLocale = i18n.language.startsWith('es') ? es : enUS;

  const getIcon = () => {
    switch (notification.type) {
      case "join_request": return <UserPlus size={12} />;
      case "accepted": return <CheckCircle size={12} />;
      case "rejected":
      case "kicked": return <XCircle size={12} />;
      case "post_deleted": return <AlertTriangle size={12} />;
      default: return <Clock size={12} />;
    }
  };

  const getMessage = () => {
    const username = notification.sender?.username || t('notifications.types.default_user');
    const postTitle = notification.posts?.title || t('notifications.types.default_activity');

    return t(`notifications.types.${notification.type}`, {
      user: `**@${username}**`,
      post: `**${postTitle}**`,
      defaultValue: t('notifications.types.default_update', { post: postTitle })
    });
  };

  return (
    <div className={`notif-card ${notification.is_read ? "read" : "unread"} ${notification.type} ${!isDarkMode ? 'light-mode' : ''}`}>
      <div className="notif-avatar-container">
        <img
          src={notification.sender?.foto_perfil || `https://api.dicebear.com/7.x/avataaars/svg?seed=${notification.sender?.username || 'Lynkn'}`}
          alt={notification.sender?.username}
          className="notif-avatar-img"
        />
        <div className={`notif-type-badge ${notification.type}`}>
          {getIcon()}
        </div>
      </div>

      <div className="notif-content">
        <p
          className="notif-text"
          dangerouslySetInnerHTML={{
            __html: getMessage().replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
          }}
        />

        <span className="notif-time">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: dateLocale,
          })}
        </span>
      </div>

      {!notification.is_read && <div className="notif-dot" />}
    </div>
  );
};

export default NotificationItem;