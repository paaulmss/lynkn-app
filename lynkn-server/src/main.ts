import { getAllowedOrigins } from './common/cors';
import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { json, urlencoded } from 'express';
import { rateLimit } from 'express-rate-limit';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  const config = app.get(ConfigService);
  const origins = getAllowedOrigins();
  const proxyHops = Number(config.get<string>('TRUST_PROXY_HOPS') || 0);
  if (!Number.isInteger(proxyHops) || proxyHops < 0) throw new Error('Invalid TRUST_PROXY_HOPS');
  if (proxyHops) app.set('trust proxy', proxyHops);
  app.disable('x-powered-by');
  app.enableCors({ origin: origins, credentials: true });
  app.use(rateLimit({ windowMs: 60000, limit: 300, standardHeaders: true, legacyHeaders: false }));
  app.use('/auth', rateLimit({ windowMs: 60000, limit: 30, standardHeaders: true, legacyHeaders: false }));
  app.use(json({ limit: '12mb' }));
  app.use(urlencoded({ limit: '12mb', extended: false }));
  app.useGlobalPipes(new ValidationPipe({
    transform: true, whitelist: true, forbidNonWhitelisted: true,
    validationError: { target: false, value: false },
  }));
  app.useGlobalFilters(new HttpExceptionFilter());
  app.enableShutdownHooks();
  const port = config.getOrThrow<number>('PORT');
  await app.listen(port, '0.0.0.0');
  Logger.log('LYNKN listening on port ' + port);
}
bootstrap().catch((error: unknown) => {
  Logger.error(error instanceof Error ? error.message : 'Startup failed');
  process.exitCode = 1;
});
