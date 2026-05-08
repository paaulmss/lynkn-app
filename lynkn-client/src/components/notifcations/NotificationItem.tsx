import React from "react";
import {
  Clock,
  CheckCircle,
  XCircle,
  UserPlus,
  AlertTriangle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
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
  // Función para determinar el icono según el tipo de notificación
  const getIcon = () => {
    switch (notification.type) {
      case "join_request":
        return <UserPlus size={12} />;
      case "accepted":
        return <CheckCircle size={12} />;
      case "rejected":
        return <XCircle size={12} />;
      case "post_deleted":
        return <AlertTriangle size={12} />;
      case "kicked":
        return <XCircle size={12} color="#ef4444" />;
      default:
        return <Clock size={12} />;
    }
  };

  // Función para generar el mensaje de la notificación
  const getMessage = () => {
    const username = notification.sender?.username || "Un usuario";
    const postTitle = notification.posts?.title || "una actividad";

    switch (notification.type) {
      case "join_request":
        return `**@${username}** quiere unirse a tu actividad **${postTitle}**.`;
      case "accepted":
        return `**@${username}** ha **aceptado** tu solicitud para **${postTitle}**. ¡Ya puedes ver la ubicación!`;
      case "rejected":
        return `**@${username}** ha **rechazado** tu solicitud para unirte a **${postTitle}**.`;
      case "kicked":
        return `Has sido **expulsado** de la actividad **${postTitle}**. Ya no tienes acceso al chat ni a la ubicación.`;
      case "info_pending":
        return `Has solicitado unirte a **${postTitle}**. Esperando respuesta del organizador...`;
      case "post_deleted":
        return `**@${username}** ha **cancelado** el evento **${postTitle}**. El grupo ha sido disuelto.`;
      default:
        return `Nueva actualización en **${postTitle}**.`;
    }
  };

  return (
    <div
      className={`notif-card ${notification.is_read ? "read" : "unread"} ${notification.type === "post_deleted" ? "alert" : ""}`}
    >
      <div className="notif-avatar-container">
        <img
          src={
            notification.sender?.foto_perfil ||
            "https://via.placeholder.com/150"
          }
          alt={notification.sender?.username}
          className="notif-avatar-img"
        />
        <div className={`notif-type-badge ${notification.type}`}>
          {getIcon()}
        </div>
      </div>

      <div className="notif-content">
        <p
          dangerouslySetInnerHTML={{
            __html: getMessage().replace(/\*\*(.*?)\*\*/g, "<b>$1</b>"),
          }}
        />

        <span className="notif-time">
          {formatDistanceToNow(new Date(notification.created_at), {
            addSuffix: true,
            locale: es,
          })}
        </span>
      </div>

      {!notification.is_read && <div className="notif-dot" />}
    </div>
  );
};

export default NotificationItem;
