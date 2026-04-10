export class CreateNotificationDto {
  user_id: number;    // ID del que recibe la notificación
  sender_id: number;  // ID del que realiza la acción
  post_id: number;    // ID del post relacionado
  type: 'join_request' | 'accepted' | 'rejected' | 'info_pending';
  is_read?: boolean;  
}