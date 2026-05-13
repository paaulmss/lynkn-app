import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import i18n from '../i18n';
import { API_BASE_URL } from '../api/axiosConfig';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;

export interface ServerMessage {
  id: number;
  post_id: number;
  sender_id: number;
  content: string;
  sent_at: string;
  users: {
    username: string;
    foto_perfil: string;
  };
}

class ChatService {
  private socket: Socket | null = null;

  connect() {
    if (this.socket?.connected) return;
    this.socket = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['polling', 'websocket']
    });

    this.socket.on('error-message', () => {
      toast.error(i18n.t('messages.socket_error'));
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinPostChat(postId: number, userId: number) {
    this.socket?.emit('join-chat', { postId, userId });
  }

  sendMessage(postId: number, senderId: number, content: string) {
    this.socket?.emit('send-message', { postId, senderId, content });
  }

  onNewMessage(callback: (msg: ServerMessage) => void) {
    this.socket?.on('new-message', callback);
  }

  // Método para dejar de escuchar mensajes (útil al cambiar de chat)
  offNewMessage() {
    this.socket?.off('new-message');
  }
}

export const chatService = new ChatService();
