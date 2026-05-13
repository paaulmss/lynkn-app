import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SupabaseService } from '../supabase.service';

interface SelfieData { sessionId: string; imageBase64: string; }
interface ChatJoinData { postId: number; userId: number; }
interface MessageData { postId: number; senderId: number; content: string; }

@WebSocketGateway({
  cors: {
    origin: [
      'https://lynkn-app.vercel.app',
      'http://localhost:5173',
      'capacitor://localhost',
      'https://localhost',
      'http://localhost',
    ],
    credentials: true,
  },
  transports: ['polling', 'websocket'],
})
export class SocketGateway implements OnGatewayConnection {
  @WebSocketServer()
  server: Server;

  constructor(private readonly supabaseService: SupabaseService) {}

  handleConnection(client: Socket) {
    console.log('Usuario conectado:', client.id);
  }

  private async canAccessPostChat(postId: number, userId: number) {
    if (!postId || !userId) return false;

    const client = this.supabaseService.getClient();

    const { data: post, error: postError } = await client
      .from('posts')
      .select('user_id')
      .eq('id', postId)
      .single();

    if (postError || !post) return false;
    if (Number(post.user_id) === Number(userId)) return true;

    const { data: participation, error: participationError } = await client
      .from('participations')
      .select('id')
      .eq('post_id', postId)
      .eq('user_id', userId)
      .eq('status', 'accepted')
      .maybeSingle();

    if (participationError) {
      console.error('Error verificando acceso al chat:', participationError.message);
      return false;
    }

    return Boolean(participation);
  }

  @SubscribeMessage('join-chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: ChatJoinData,
  ) {
    const canAccess = await this.canAccessPostChat(data.postId, data.userId);

    if (!canAccess) {
      console.log(`Intento de union denegado. Chat sin acceso: post ${data.postId}, user ${data.userId}`);
      client.emit('error-message', { msg: 'No tienes acceso a este chat.' });
      return;
    }

    const room = `post_${data.postId}`;
    client.join(room);
    console.log(`Usuario autorizado unido a la sala: ${room}`);
  }

  @SubscribeMessage('send-message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: MessageData,
  ) {
    const canAccess = await this.canAccessPostChat(data.postId, data.senderId);

    if (!canAccess) {
      client.emit('error-message', { msg: 'No tienes acceso a este chat.' });
      return { status: 'error', reason: 'chat_forbidden' };
    }

    const room = `post_${data.postId}`;

    const { data: savedMessage, error } = await this.supabaseService
      .getClient()
      .from('messages')
      .insert([{
        post_id: data.postId,
        sender_id: data.senderId,
        content: data.content,
      }])
      .select('*, users(username, foto_perfil)')
      .single();

    if (error) {
      console.error('Error guardando mensaje:', error.message);
      return { status: 'error' };
    }

    this.server.to(room).emit('new-message', savedMessage);
    return { status: 'ok' };
  }

  @SubscribeMessage('join-session')
  handleJoinSession(@ConnectedSocket() client: Socket, @MessageBody() sessionId: string) {
    client.join(sessionId);
  }

  @SubscribeMessage('send-selfie')
  handleSendSelfie(@MessageBody() data: SelfieData) {
    this.server.to(data.sessionId).emit('receive-selfie', data.imageBase64);
    return { status: 'ok' };
  }
}
