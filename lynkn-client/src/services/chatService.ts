import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import i18n from '../i18n';
import { API_BASE_URL } from '../api/axiosConfig';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE_URL;
export interface ServerMessage {
  id: number; post_id: number; sender_id: number; content: string; sent_at: string;
  type?: string;
  users: { username: string; foto_perfil: string } | null;
}
interface MessageAck { status: 'ok' | 'error'; message?: ServerMessage; }

class ChatService {
  private socket: Socket | null = null;
  private activePostId: number | null = null;

  connect() {
    if (this.socket) return;
    const socket = io(SOCKET_URL, {
      autoConnect: false,
      auth: (callback) => callback({ token: localStorage.getItem('lynkn_token') }),
      withCredentials: true,
      transports: ['polling', 'websocket'],
    });
    this.socket = socket;
    socket.on('connect', () => {
      if (this.activePostId !== null) socket.emit('join-chat', { postId: this.activePostId });
    });
    socket.on('error-message', () => toast.error(i18n.t('messages.socket_error')));
    socket.connect();
  }
  disconnect() {
    this.socket?.removeAllListeners();
    this.socket?.disconnect();
    this.socket = null;
    this.activePostId = null;
  }
  joinPostChat(postId: number) {
    this.activePostId = postId;
    if (this.socket?.connected) this.socket.emit('join-chat', { postId });
  }
  sendMessage(postId: number, content: string): Promise<ServerMessage> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) { reject(new Error('Chat desconectado')); return; }
      this.socket.timeout(10000).emit('send-message', { postId, content },
        (error: Error | null, result?: MessageAck) => {
          if (error || result?.status !== 'ok' || !result.message) reject(new Error('No se pudo enviar el mensaje'));
          else resolve(result.message);
        });
    });
  }
  onReady(callback: (data: { postId: number }) => void) {
    const socket = this.socket;
    socket?.on('chat-ready', callback);
    return () => { socket?.off('chat-ready', callback); };
  }
  onNewMessage(callback: (message: ServerMessage) => void) {
    const socket = this.socket;
    socket?.on('new-message', callback);
    return () => { socket?.off('new-message', callback); };
  }
}
export const chatService = new ChatService();
