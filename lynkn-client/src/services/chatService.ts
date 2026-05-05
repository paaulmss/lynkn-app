import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.PROD 
  ? 'https://lynkn-backend.onrender.com'
  : 'http://localhost:3000';

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

    this.socket.on('error-message', (data: { msg: string }) => {
      alert(data.msg);
    });
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  joinPostChat(postId: number) {
    this.socket?.emit('join-chat', { postId });
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