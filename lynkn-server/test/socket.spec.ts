import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Socket } from 'socket.io';
import { SocketGateway } from '../src/socket/socket.gateway';
import { ChatService } from '../src/socket/chat.service';
import { UsersService } from '../src/users/users.service';

describe('Socket identity and selfie capabilities', () => {
  const secret = 'test-only-secret-with-at-least-32-characters';
  let gateway: SocketGateway;
  let jwt: JwtService;
  const chats = { assertAccess: jest.fn(async () => undefined), save: jest.fn(), canAccess: jest.fn() };
  const users = { findOne: jest.fn(async () => ({ id: 1, role: 'user', email: 'a@test', status_verif: 'approved' })) };
  const emit = jest.fn();
  const socket = (token?: string) => ({
    id: 'socket-one', handshake: { auth: { token } }, data: {},
    rooms: new Set(['socket-one']), join: jest.fn(), leave: jest.fn(), emit: jest.fn(),
  } as unknown as Socket);
  beforeEach(() => {
    jwt = new JwtService({ secret });
    gateway = new SocketGateway(chats as unknown as ChatService, users as unknown as UsersService,
      jwt, { getOrThrow: () => secret } as unknown as ConfigService);
    gateway.server = { to: () => ({ emit }) } as never;
  });
  it('rejects joining a chat without a token even if an identity is supplied', async () => {
    expect(await gateway.join(socket(), { postId: 10, userId: 1 })).toEqual({ status: 'error' });
    expect(chats.assertAccess).not.toHaveBeenCalled();
  });
  it('rejects identity injection in an authenticated chat event', async () => {
    expect(await gateway.join(socket(jwt.sign({ sub: 1 })), { postId: 10, userId: 99 })).toEqual({ status: 'error' });
  });
  it('authorizes the verified token subject', async () => {
    expect(await gateway.join(socket(jwt.sign({ sub: 1 })), { postId: 10 })).toEqual({ status: 'ok' });
    expect(chats.assertAccess).toHaveBeenCalledWith(10, 1);
  });
  it('requires a valid one-time capability and rejects replay', async () => {
    const owner = socket();
    const result = await gateway.createSelfie(owner);
    expect(result.status).toBe('ok');
    const payload = { sessionId: result.sessionId, token: result.token, imageBase64: 'data:image/png;base64,AAAA' };
    expect(await gateway.selfie(socket(), { ...payload, token: '0'.repeat(64) })).toEqual({ status: 'error' });
    expect(emit).not.toHaveBeenCalled();
    expect(await gateway.selfie(socket(), payload)).toEqual({ status: 'ok' });
    expect(emit).toHaveBeenCalledWith('receive-selfie', payload.imageBase64);
    expect(await gateway.selfie(socket(), payload)).toEqual({ status: 'error' });
  });
  it('invalidates selfie sessions when the receiver disconnects', async () => {
    const owner = socket();
    const result = await gateway.createSelfie(owner);
    gateway.handleDisconnect(owner);
    expect(await gateway.selfie(socket(), {
      sessionId: result.sessionId, token: result.token, imageBase64: 'data:image/png;base64,AAAA',
    })).toEqual({ status: 'error' });
  });
});
