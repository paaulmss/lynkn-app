import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';

describe('Application module wiring', () => {
  let app: INestApplication;
  afterEach(async () => { await app?.close(); });
  it('boots the full module graph without contacting the database', async () => {
    process.env.JWT_SECRET = 'test-only-secret-with-at-least-32-characters';
    process.env.SUPABASE_URL = 'https://example.supabase.co';
    process.env.SUPABASE_KEY = 'test-only-key';
    const { AppModule } = await import('../src/app.module');
    const module = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = module.createNestApplication();
    await app.listen(0, '127.0.0.1');
    const response = await fetch(await app.getUrl() + '/health');
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({ status: 'ok' });
  });
});
