import 'reflect-metadata';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from '../src/auth/auth.service';
import { UsersService } from '../src/users/users.service';
import { SupabaseService } from '../src/supabase.service';

describe('Supabase identity exchange', () => {
  const local = { id: 2, email: 'attacker@example.test', username: 'attacker', role: 'user', status_verif: 'unverified' };
  const users = {
    findBySupabaseAuthId: jest.fn(), findByEmail: jest.fn(), findByPhone: jest.fn(),
    findByUsername: jest.fn(), create: jest.fn(), updatePasswordlessIdentity: jest.fn(),
  };
  const getUser = jest.fn();
  const jwt = { sign: jest.fn(() => 'signed-token') };
  let service: AuthService;
  beforeEach(() => {
    users.findBySupabaseAuthId.mockResolvedValue(null);
    users.findByEmail.mockResolvedValue(null);
    users.findByPhone.mockResolvedValue(null);
    users.findByUsername.mockResolvedValue(null);
    users.create.mockResolvedValue(local);
    service = new AuthService(users as unknown as UsersService, jwt as unknown as JwtService,
      { getClient: () => ({ auth: { getUser } }) } as unknown as SupabaseService);
  });
  it('does not use a phone supplied in editable metadata to find or link a local account', async () => {
    getUser.mockResolvedValue({ data: { user: {
      id: 'external-uuid', email: local.email, email_confirmed_at: '2026-01-01',
      user_metadata: { phone: '+34600000000' },
    } }, error: null });
    const result = await service.exchangeSupabaseSession('valid-token');
    expect(users.findByPhone).not.toHaveBeenCalled();
    expect(users.create).toHaveBeenCalledWith(expect.objectContaining({ phone: null, supabase_auth_id: 'external-uuid' }));
    expect(result.user.id).toBe(2);
  });
  it('rejects identities with no confirmed email or phone', async () => {
    getUser.mockResolvedValue({ data: { user: {
      id: 'external-uuid', email: local.email, user_metadata: { phone: '+34600000000' },
    } }, error: null });
    await expect(service.exchangeSupabaseSession('valid-token')).rejects.toThrow('ERR_OTP_SESSION_INVALID');
    expect(jwt.sign).not.toHaveBeenCalled();
  });
  it('requires an explicit linking flow for an existing local email', async () => {
    getUser.mockResolvedValue({ data: { user: {
      id: 'external-uuid', email: local.email, email_confirmed_at: '2026-01-01',
    } }, error: null });
    users.findByEmail.mockResolvedValue({ ...local, id: 1 });
    await expect(service.exchangeSupabaseSession('valid-token')).rejects.toThrow('ERR_ACCOUNT_LINK_REQUIRED');
    expect(users.updatePasswordlessIdentity).not.toHaveBeenCalled();
    expect(jwt.sign).not.toHaveBeenCalled();
  });
  it('serializes an already linked account without hashes or selfie data', async () => {
    getUser.mockResolvedValue({ data: { user: {
      id: 'external-uuid', email: local.email, email_confirmed_at: '2026-01-01',
    } }, error: null });
    users.findBySupabaseAuthId.mockResolvedValue({
      ...local, supabase_auth_id: 'external-uuid', pwd: 'private-hash', selfie_real_time: 'private-image',
    });
    const result = await service.exchangeSupabaseSession('valid-token');
    expect(result.user).not.toHaveProperty('pwd');
    expect(result.user).not.toHaveProperty('selfie_real_time');
    expect(users.create).not.toHaveBeenCalled();
  });
});
