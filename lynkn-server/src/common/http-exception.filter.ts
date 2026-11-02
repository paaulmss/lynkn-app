import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Logger } from '@nestjs/common';
import type { Response } from 'express';

function redact(message: string): string {
  return message
    .replace(/Bearer\s+[^\s"',}]+/gi, 'Bearer [REDACTED]')
    .replace(/sb_(?:secret|publishable)_[A-Za-z0-9_-]+/g, '[REDACTED]')
    .replace(/eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, '[REDACTED]');
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);
  catch(error: unknown, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    const status = error instanceof HttpException ? error.getStatus() : 500;
    if (status >= 500) {
      if (error instanceof Error) {
        this.logger.error(redact(error.stack || error.message));
      } else if (error && typeof error === 'object') {
        const code = 'code' in error && typeof error.code === 'string' ? error.code : 'UNKNOWN';
        const message = 'message' in error && typeof error.message === 'string' ? error.message : 'Unexpected server error';
        // PostgREST returns plain objects, not Error instances. Log selected fields only.
        this.logger.error(redact('[' + code + '] ' + message));
      } else {
        this.logger.error('Unexpected server error');
      }
    }
    const detail = error instanceof HttpException ? error.getResponse() : undefined;
    const moderationUnavailable = status === 503 && detail && typeof detail === 'object'
      && 'code' in detail && detail.code === 'MODERATION_UNAVAILABLE';
    response.status(status).json(moderationUnavailable ? detail : status >= 500
      ? { statusCode: status, message: 'Error interno del servidor' }
      : error instanceof HttpException ? error.getResponse() : { statusCode: status });
  }
}
