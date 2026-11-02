import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../src/auth/auth.service';
import { AuthController } from '../src/auth/auth.controller';
import { JwtStrategy } from '../src/auth/strategies/jwt.strategy';
import { UsersController } from '../src/users/users.controller';
import { UsersService } from '../src/users/users.service';
import { NotificationsController } from '../src/notifications/notifications.controller';
import { NotificationsService } from '../src/notifications/notifications.service';
import { PostsController } from '../src/posts/posts.controller';
import { PostsService } from '../src/posts/posts.service';
import { toSessionUser, parseSubject } from '../src/common/security';

const secret = 'test-only-secret-with-at-least-32-characters';
const user = { id: 1, email: 'one@example.test', username: 'one', role: 'user', status_verif: 'approved' };
describe('HTTP authorization boundaries', () => {
  let app: INestApplication;
  let base: string;
  let token: string;
  const users = {
    findOne: jest.fn(async (id: number) => id === 1 ? user : null),
    deleteAccount: jest.fn(async () => undefined),
    updateStatus: jest.fn(async () => undefined),
    updatePreferences: jest.fn(async () => user),
    followUser: jest.fn(async () => ({})),
  };
  const posts = {
    requestJoin: jest.fn(async () => ({})),
    updateParticipationStatus: jest.fn(async () => ({})),
  };
  const notifications = { findByUser: jest.fn(async () => []) };
  const auth = { register: jest.fn(async () => ({})) };
  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [PassportModule, JwtModule.register({ secret, signOptions: { expiresIn: '1h' } })],
      controllers: [UsersController, NotificationsController, PostsController, AuthController],
      providers: [
        JwtStrategy,
        { provide: ConfigService, useValue: { getOrThrow: () => secret } },
        { provide: UsersService, useValue: users },
        { provide: PostsService, useValue: posts },
        { provide: NotificationsService, useValue: notifications },
        { provide: AuthService, useValue: auth },
      ],
    }).compile();
    app = module.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true, forbidNonWhitelisted: true }));
    await app.listen(0, '127.0.0.1');
    base = await app.getUrl();
    token = module.get(JwtService).sign({ sub: 1, role: 'admin' });
  });
  afterAll(async () => { await app?.close(); });
  const request = (path: string, method = 'GET', body?: unknown, bearer: string | null = token) =>
    fetch(base + path, {
      method,
      headers: { ...(bearer ? { Authorization: 'Bearer ' + bearer } : {}), 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });

  it('rejects anonymous account deletion', async () => {
    expect((await request('/users/1', 'DELETE', undefined, null)).status).toBe(401);
    expect(users.deleteAccount).not.toHaveBeenCalled();
  });
  it('uses the current database role rather than a stale admin claim', async () => {
    expect((await request('/users/2', 'DELETE')).status).toBe(403);
    expect(users.deleteAccount).not.toHaveBeenCalled();
  });
  it('allows deleting the authenticated account', async () => {
    expect((await request('/users/1', 'DELETE')).status).toBe(200);
    expect(users.deleteAccount).toHaveBeenCalledWith(1);
  });
  it('rejects an expired signed token', async () => {
    const jwt = app.get(JwtService).sign({ sub: 1 }, { expiresIn: -1 });
    expect((await request('/users/1', 'DELETE', undefined, jwt)).status).toBe(401);
  });
  it('rejects access to another users notifications', async () => {
    expect((await request('/notifications/user/2')).status).toBe(403);
    expect(notifications.findByUser).not.toHaveBeenCalled();
  });
  it('rejects writing another users preferences', async () => {
    expect((await request('/users/2/preferences', 'PUT', { theme: 'dark', language: 'es' })).status).toBe(403);
    expect(users.updatePreferences).not.toHaveBeenCalled();
  });
  it('rejects invalid preference values', async () => {
    expect((await request('/users/1/preferences', 'PUT', { theme: 'arbitrary', language: 'es' })).status).toBe(400);
  });
  it('derives a follow actor from the JWT, ignoring the supplied identity', async () => {
    expect((await request('/users/2/follow', 'POST', { followerId: 99 })).status).toBe(201);
    expect(users.followUser).toHaveBeenCalledWith(1, 2);
  });
  it('requires authentication for post participation', async () => {
    expect((await request('/posts/10/join', 'POST', { userId: 99 }, null)).status).toBe(401);
    expect(posts.requestJoin).not.toHaveBeenCalled();
  });
  it('derives the participant from the JWT', async () => {
    expect((await request('/posts/10/join', 'POST', { userId: 99 })).status).toBe(201);
    expect(posts.requestJoin).toHaveBeenCalledWith(10, 1);
  });
  it('validates participation state at runtime', async () => {
    expect((await request('/posts/participation/10', 'PATCH', { status: 'admin' })).status).toBe(400);
    expect(posts.updateParticipationStatus).not.toHaveBeenCalled();
  });
  it('rejects public reverification', async () => {
    expect((await request('/auth/reverify', 'POST', { imageBase64: 'data:image/png;base64,AAAA' }, null)).status).toBe(401);
  });
  it('rejects reverification identity injection', async () => {
    expect((await request('/auth/reverify', 'POST', { userId: 2, imageBase64: 'data:image/png;base64,AAAA' })).status).toBe(400);
    expect(users.updateStatus).not.toHaveBeenCalled();
  });
  it('rejects invalid dates and unexpected registration privileges', async () => {
    expect((await request('/auth/register', 'POST', {
      email: 'test@example.test', username: 'test', password: 'testpass123',
      birth_day: 'not-a-date', terms_accepted: true, role: 'admin',
    }, null)).status).toBe(400);
    expect(auth.register).not.toHaveBeenCalled();
  });
});
describe('Session serialization', () => {
  it('never exposes hashes, selfies or external identity identifiers', () => {
    const result = toSessionUser({ ...user, pwd: 'hash', selfie_real_time: 'private', supabase_auth_id: 'uuid' });
    expect(result).not.toHaveProperty('pwd');
    expect(result).not.toHaveProperty('selfie_real_time');
    expect(result).not.toHaveProperty('supabase_auth_id');
    expect(result.id).toBe(1);
  });
  it.each([null, {}, { sub: '1' }, { sub: -1 }, { sub: 1.5 }])('rejects invalid JWT subjects: %p', (payload) => {
    expect(() => parseSubject(payload)).toThrow();
  });
});
