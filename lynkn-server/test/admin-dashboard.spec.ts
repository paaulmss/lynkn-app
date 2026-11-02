import 'reflect-metadata';
import { ArgumentsHost, Logger } from '@nestjs/common';
import { AdminService } from '../src/admin/admin.service';
import { SupabaseService } from '../src/supabase.service';
import { HttpExceptionFilter } from '../src/common/http-exception.filter';

describe('Dashboard schema compatibility', () => {
  it('works with the current posts schema, which has no created_at column', async () => {
    const projections: Record<string, string> = {};
    const rows: Record<string, object[]> = {
      users: [{ id: 1, username: 'admin', role: 'admin', status_verif: 'approved', created_at: '2026-01-01' }],
      posts: [{ id: 10, title: 'Event', user_id: 1, is_visible: true, current_particip: 0, max_particip: 5,
        event_date: '2026-11-01', users: { username: 'admin', foto_perfil: '' } }],
      participations: [], messages: [], notifications: [], post_reports: [],
    };
    const db = { from: (table: string) => ({
      select: async (columns: string) => {
        projections[table] = columns;
        return table === 'posts' && columns.split(',').map((value) => value.trim()).includes('created_at')
          ? { data: null, error: { code: '42703', message: 'column posts.created_at does not exist' } }
          : { data: rows[table] || [], error: null };
      },
    }) };
    const service = new AdminService({ getClient: () => db } as unknown as SupabaseService);
    const dashboard = await service.getDashboard();
    expect(dashboard.totals.posts).toBe(1);
    expect(dashboard.totals.admins).toBe(1);
    expect(projections.posts.split(',')).not.toContain('created_at');
    expect(dashboard.recentActivity.find((activity) => activity.type === 'post')?.created_at).toBe('2026-11-01');
  });
});
describe('Database error diagnostics', () => {
  afterEach(() => jest.restoreAllMocks());
  it('logs plain PostgREST errors while keeping SQL details out of the HTTP response', () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    const host = { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch({ code: '42703', message: 'column posts.created_at does not exist' }, host);
    expect(log).toHaveBeenCalledWith('[42703] column posts.created_at does not exist');
    expect(response.json).toHaveBeenCalledWith({ statusCode: 500, message: 'Error interno del servidor' });
  });
  it('redacts credentials without dumping database error objects', () => {
    const log = jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const response = { status: jest.fn(), json: jest.fn() };
    response.status.mockReturnValue(response);
    const host = { switchToHttp: () => ({ getResponse: () => response }) } as unknown as ArgumentsHost;
    new HttpExceptionFilter().catch({ code: 'TEST', message: 'Bearer private-token sb_secret_example', details: 'private details' }, host);
    expect(log).toHaveBeenCalledWith('[TEST] Bearer [REDACTED] [REDACTED]');
  });
});
