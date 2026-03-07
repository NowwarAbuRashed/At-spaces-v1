import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { Observable, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { AppLogger } from '../logging/app-logger.service';

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestLoggingInterceptor implements NestInterceptor {
  constructor(
    private readonly appLogger: AppLogger,
    private readonly configService: ConfigService,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http' || !this.isRequestLoggingEnabled()) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<RequestWithId>();
    const response = context.switchToHttp().getResponse<Response>();
    const startedAt = Date.now();
    let capturedError: unknown;

    return next.handle().pipe(
      catchError((error: unknown) => {
        capturedError = error;
        return throwError(() => error);
      }),
      finalize(() => {
        const statusCode = this.resolveStatusCode(response.statusCode, capturedError);
        const payload = {
          method: request.method,
          path: request.originalUrl ?? request.url,
          statusCode,
          durationMs: Date.now() - startedAt,
          ipAddress: request.ip ?? request.socket.remoteAddress ?? 'unknown',
          userAgent: request.get('user-agent') ?? 'unknown',
          requestId: request.requestId,
        };

        if (capturedError) {
          const errorPayload = {
            ...payload,
            error: this.normalizeError(capturedError),
          };
          if (statusCode >= 500) {
            this.appLogger.error('http_request_failed', errorPayload);
            return;
          }

          this.appLogger.warn('http_request_failed', errorPayload);
          return;
        }

        if (statusCode >= 500) {
          this.appLogger.error('http_request', payload);
          return;
        }

        if (statusCode >= 400) {
          this.appLogger.warn('http_request', payload);
          return;
        }

        this.appLogger.log('http_request', payload);
      }),
    );
  }

  private resolveStatusCode(baseStatusCode: number, error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }

    if (error) {
      return 500;
    }

    return baseStatusCode;
  }

  private normalizeError(error: unknown): Record<string, unknown> {
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';

    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const message = this.extractMessage(response);
      return {
        name: error.name,
        status,
        message: status >= 500 && isProduction ? 'Internal server error' : message,
      };
    }

    if (error instanceof Error) {
      return {
        name: error.name,
        message: isProduction ? 'Internal server error' : error.message,
      };
    }

    return {
      name: 'UnknownError',
      message: 'Internal server error',
    };
  }

  private extractMessage(response: string | object): string {
    if (typeof response === 'string') {
      return response;
    }

    if (response && typeof response === 'object') {
      const record = response as Record<string, unknown>;
      const message = record.message;
      if (typeof message === 'string') {
        return message;
      }

      if (Array.isArray(message)) {
        return message.join(', ');
      }
    }

    return 'Request failed';
  }

  private isRequestLoggingEnabled(): boolean {
    const value = this.configService.get<string>('ENABLE_REQUEST_LOGGING');
    return (value ?? 'true').toLowerCase() === 'true';
  }
}
