import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { SupabaseService } from '../src/supabase.service';

describe('Compatibility of Google and password login', () => {
  const originalClientId = process.env.GOOGLE_CLIENT_ID;
  const clientId = 'test-client.apps.googleusercontent.com';
  const account = { id: 7, username: 'existing_user', email: 'existing@gmail.com',
    role: 'user', status_verif: 'approved', google_id: null, foto_perfil: 'https://example.test/avatar.png', pwd: '' };
  const users = {
    findByIdentifier: jest.fn(), findByEmail: jest.fn(), findByGoogleId: jest.fn(),
    updateGoogleIdentity: jest.fn(), create: jest.fn(),
  };
  const jwt = { sign: jest.fn(() => 'session-token') };
  let service: AuthService;
  beforeAll(async () => {
    account.pwd = await bcrypt.hash('old-password', 4);
  });
  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = clientId;
    users.findByIdentifier.mockResolvedValue(account);
    users.findByEmail.mockResolvedValue(account);
    users.findByGoogleId.mockResolvedValue(null);
    users.updateGoogleIdentity.mockImplementation(async (_id: number, update: object) => ({ ...account, ...update }));
    jest.spyOn(OAuth2Client.prototype, 'getTokenInfo').mockResolvedValue({
      aud: clientId, email: account.email, scopes: [], expiry_date: Date.now() + 60000,
    });
    jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(JSON.stringify({
      sub: 'google-subject', email: account.email, email_verified: true,
    }), { status: 200 }));
    service = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService,
      { getClient: jest.fn() } as unknown as SupabaseService);
  });
  afterEach(() => { jest.restoreAllMocks(); });
  afterAll(() => {
    if (originalClientId === undefined) delete process.env.GOOGLE_CLIENT_ID;
    else process.env.GOOGLE_CLIENT_ID = originalClientId;
  });
  it.each(['existing_user', 'existing@gmail.com'])('accepts the existing password via %s', async (identifier) => {
    const result = await service.login({ identifier, password: 'old-password' });
    expect(result.access_token).toBe('session-token');
    expect(result.user.id).toBe(account.id);
    expect(result.user).not.toHaveProperty('pwd');
    expect(users.updateGoogleIdentity).not.toHaveBeenCalled();
  });
  it('rejects an incorrect password', async () => {
    await expect(service.login({ identifier: account.username, password: 'incorrect' })).rejects.toThrow('ERR_INVALID_CREDENTIALS');
  });
  it('links a verified Gmail login to the existing account without replacing its password', async () => {
    const result = await service.validateGoogleUser('google-access-token');
    expect(users.updateGoogleIdentity).toHaveBeenCalledWith(account.id, {
      google_id: 'google-subject', foto_perfil: account.foto_perfil,
    });
    expect(result.user.id).toBe(account.id);
    expect(users.create).not.toHaveBeenCalled();
  });
  it('accepts an already linked Google subject even after its email changes', async () => {
    users.findByGoogleId.mockResolvedValue({ ...account, google_id: 'google-subject' });
    expect((await service.validateGoogleUser('google-access-token')).user.id).toBe(account.id);
    expect(users.findByEmail).not.toHaveBeenCalled();
    expect(users.updateGoogleIdentity).not.toHaveBeenCalled();
  });
  it('does not overwrite an account linked to a different Google subject', async () => {
    users.findByEmail.mockResolvedValue({ ...account, google_id: 'another-subject' });
    await expect(service.validateGoogleUser('google-access-token')).rejects.toThrow('ERR_ACCOUNT_LINK_REQUIRED');
    expect(users.updateGoogleIdentity).not.toHaveBeenCalled();
  });
  it('rejects an unverified Google email', async () => {
    jest.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({
      sub: 'google-subject', email: account.email, email_verified: false,
    }), { status: 200 }));
    await expect(service.validateGoogleUser('google-access-token')).rejects.toThrow('ERR_GOOGLE_TOKEN_INVALID');
    expect(users.updateGoogleIdentity).not.toHaveBeenCalled();
  });
});

describe('Legacy email lookup', () => {
  it('matches email without case sensitivity and escapes wildcard characters', async () => {
    const query = { select: jest.fn(), ilike: jest.fn(), eq: jest.fn(), maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }) };
    query.select.mockReturnValue(query); query.ilike.mockReturnValue(query); query.eq.mockReturnValue(query);
    const users = new UsersService({ getClient: () => ({ from: () => query }) } as unknown as SupabaseService);
    await users.findByIdentifier('Mixed_Tag@Example.test');
    expect(query.ilike).toHaveBeenCalledWith('email', 'Mixed\\_Tag@Example.test');
    expect(query.eq).not.toHaveBeenCalled();
  });
});
