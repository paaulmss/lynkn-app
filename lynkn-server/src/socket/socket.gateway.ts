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
interface ChatJoinData { postId: number; }
interface MessageData { postId: number; senderId: number; content: string; }

@WebSocketGateway({
  cors: {
    origin: ["https://lynkn-app.vercel.app", "http://localhost:5173"], 
    credentials: true
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

  // --- LOGICA DE CHAT GRUPAL CON PROTECCION ---

  @SubscribeMessage('join-chat')
  async handleJoinChat(
    @ConnectedSocket() client: Socket, 
    @MessageBody() data: ChatJoinData
  ) {
    // VALIDACION: Verificar si el chat esta activo en la DB
    const { data: post } = await this.supabaseService
      .getClient()
      .from('posts')
      .select('is_chat_active')
      .eq('id', data.postId)
      .single();

    if (!post || !post.is_chat_active) {
      console.log(`Intento de unión denegado. Chat inactivo: ${data.postId}`);
      client.emit('error-message', { msg: 'El chat aún no está disponible.' });
      return;
    }

    const room = `post_${data.postId}`;
    client.join(room);
    console.log(`Usuario autorizado unido a la sala: ${room}`);
  }

  @SubscribeMessage('send-message')
  async handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: MessageData) {
    // VALIDACION: Doble chequeo antes de guardar el mensaje
    const { data: post } = await this.supabaseService
      .getClient()
      .from('posts')
      .select('is_chat_active')
      .eq('id', data.postId)
      .single();

    if (!post || !post.is_chat_active) {
      client.emit('error-message', { msg: 'No puedes enviar mensajes a un chat inactivo.' });
      return { status: 'error', reason: 'chat_inactive' };
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

  // --- LOGICA DE BIOMETRIA ---
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