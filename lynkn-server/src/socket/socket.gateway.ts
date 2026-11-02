import { getAllowedOrigins } from '../common/cors';
import { OnGatewayDisconnect, ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { Server, Socket } from 'socket.io';
import { UsersService } from '../users/users.service';
import { parseSubject, Principal } from '../common/security';
import { ChatMessageDto, ChatPostDto } from '../common/dtos';
import { ChatService } from './chat.service';

interface SelfieSession { owner: string; token: string; expiresAt: number; }
interface SelfiePayload { sessionId?: unknown; token?: unknown; imageBase64?: unknown; }

@WebSocketGateway({
  cors: {
    origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
      const origins = getAllowedOrigins();
      callback(origin && !origins.includes(origin) ? new Error('Origin not allowed') : null, true);
    },
    credentials: true,
  },
  maxHttpBufferSize: 5 * 1024 * 1024,
  transports: ['polling', 'websocket'],
})
export class SocketGateway implements OnGatewayDisconnect {
  @WebSocketServer() server!: Server;
  private readonly sessions = new Map<string, SelfieSession>();
  constructor(
    private readonly chats: ChatService,
    private readonly users: UsersService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  handleDisconnect(client: Socket) {
    for (const [id, session] of this.sessions) if (session.owner === client.id) this.sessions.delete(id);
  }

  private consume(client: Socket) {
    const now = Date.now();
    const budget = client.data.budget as { start: number; count: number } | undefined;
    if (!budget || now - budget.start > 10000) client.data.budget = { start: now, count: 1 };
    else if (++budget.count > 25) throw new BadRequestException('Demasiados eventos');
  }

  private async actor(client: Socket): Promise<Principal> {
    const token: unknown = client.handshake.auth?.token;
    if (typeof token !== 'string' || token.length > 10000) throw new UnauthorizedException();
    const payload: unknown = await this.jwt.verifyAsync(token, {
      secret: this.config.getOrThrow<string>('JWT_SECRET'), algorithms: ['HS256'],
    });
    const user = await this.users.findOne(parseSubject(payload));
    if (!user || !['user', 'admin'].includes(user.role)) throw new UnauthorizedException();
    return { userId: user.id, role: user.role, email: user.email, status: user.status_verif };
  }

  private async input<T extends object>(ctor: new () => T, value: unknown): Promise<T> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) throw new BadRequestException();
    const dto = plainToInstance(ctor, value);
    if ((await validate(dto, { whitelist: true, forbidNonWhitelisted: true })).length) throw new BadRequestException();
    return dto;
  }

  @SubscribeMessage('join-chat')
  async join(@ConnectedSocket() client: Socket, @MessageBody() input: unknown) {
    try {
      this.consume(client);
      const [actor, dto] = await Promise.all([this.actor(client), this.input(ChatPostDto, input)]);
      await this.chats.assertAccess(dto.postId, actor.userId);
      for (const room of client.rooms) if (room.startsWith('post_')) await client.leave(room);
      await client.join('post_' + dto.postId);
      client.emit('chat-ready', { postId: dto.postId });
      return { status: 'ok' };
    } catch {
      client.emit('error-message', { msg: 'No tienes acceso a este chat' });
      return { status: 'error' };
    }
  }

  @SubscribeMessage('send-message')
  async message(@ConnectedSocket() client: Socket, @MessageBody() input: unknown) {
    try {
      this.consume(client);
      const [actor, dto] = await Promise.all([this.actor(client), this.input(ChatMessageDto, input)]);
      const saved = await this.chats.save(dto.postId, actor.userId, dto.content);
      const room = 'post_' + dto.postId;
      // Recheck recipients: a kicked participant must stop receiving immediately.
      const recipients = await this.server.in(room).fetchSockets();
      await Promise.all(recipients.map(async (recipient) => {
        const local = this.server.sockets.sockets.get(recipient.id);
        if (!local) return;
        try {
          const principal = await this.actor(local);
          if (await this.chats.canAccess(dto.postId, principal.userId)) recipient.emit('new-message', saved);
          else await recipient.leave(room);
        } catch { await recipient.leave(room); }
      }));
      return { status: 'ok', message: saved };
    } catch {
      return { status: 'error', reason: 'message_rejected' };
    }
  }

  @SubscribeMessage('create-selfie-session')
  async createSelfie(@ConnectedSocket() client: Socket) {
    try {
      this.consume(client);
      const now = Date.now();
      for (const [id, session] of this.sessions) {
        if (session.expiresAt <= now || session.owner === client.id) this.sessions.delete(id);
      }
      if (this.sessions.size >= 1000) return { status: 'error' };
      const sessionId = randomUUID();
      const token = randomBytes(32).toString('hex');
      const expiresAt = now + 5 * 60000;
      this.sessions.set(sessionId, { owner: client.id, token, expiresAt });
      return { status: 'ok', sessionId, token, expiresAt };
    } catch { return { status: 'error' }; }
  }

  @SubscribeMessage('send-selfie')
  async selfie(@ConnectedSocket() client: Socket, @MessageBody() input: unknown) {
    try {
      this.consume(client);
      if (!input || typeof input !== 'object') return { status: 'error' };
      const data = input as SelfiePayload;
      if (typeof data.sessionId !== 'string' || typeof data.token !== 'string' ||
          typeof data.imageBase64 !== 'string' || data.imageBase64.length > 5000000 ||
          !/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(data.imageBase64)) return { status: 'error' };
      const session = this.sessions.get(data.sessionId);
      if (!session || session.expiresAt <= Date.now() || data.token.length !== 64 ||
          !timingSafeEqual(Buffer.from(data.token), Buffer.from(session.token))) return { status: 'error' };
      this.sessions.delete(data.sessionId);
      this.server.to(session.owner).emit('receive-selfie', data.imageBase64);
      return { status: 'ok' };
    } catch { return { status: 'error' }; }
  }
}
