import { Injectable, LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RequestContextService } from './request-context.service';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const SENSITIVE_KEY_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /authorization/i,
  /cookie/i,
  /api[-_]?key/i,
  /hcaptcha/i,
];

@Injectable()
export class AppLogger implements LoggerService {
  constructor(
    private readonly requestContextService: RequestContextService,
    private readonly configService: ConfigService,
  ) {}

  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write('info', this.normalizeMessage(message), this.optionalParamsToMeta(optionalParams));
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write('warn', this.normalizeMessage(message), this.optionalParamsToMeta(optionalParams));
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write('debug', this.normalizeMessage(message), this.optionalParamsToMeta(optionalParams));
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.debug(message, ...optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    const metadata = this.errorParamsToMeta(optionalParams);
    this.write('error', this.normalizeMessage(message), metadata);
  }

  private errorParamsToMeta(optionalParams: unknown[]): Record<string, unknown> | undefined {
    if (optionalParams.length === 1 && this.isRecord(optionalParams[0])) {
      return optionalParams[0];
    }

    const [trace, context] = optionalParams;
    const metadata: Record<string, unknown> = {};
    if (typeof context === 'string' && context.trim().length > 0) {
      metadata.context = context.trim();
    }

    if (
      typeof trace === 'string' &&
      trace.trim().length > 0 &&
      this.configService.get<string>('NODE_ENV') !== 'production'
    ) {
      metadata.trace = trace;
    }

    return Object.keys(metadata).length > 0 ? metadata : undefined;
  }

  private optionalParamsToMeta(optionalParams: unknown[]): Record<string, unknown> | undefined {
    if (optionalParams.length === 0) {
      return undefined;
    }

    if (optionalParams.length === 1) {
      const [value] = optionalParams;
      if (typeof value === 'string') {
        return { context: value };
      }

      if (this.isRecord(value)) {
        return value;
      }

      return { data: value };
    }

    return { data: optionalParams };
  }

  private write(level: LogLevel, message: string, metadata?: Record<string, unknown>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const requestId = this.requestContextService.getRequestId();
    const payload: Record<string, unknown> = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(requestId ? { requestId } : {}),
    };

    if (metadata) {
      payload.metadata = this.sanitizeValue(metadata);
    }

    const line = JSON.stringify(payload);
    if (level === 'error') {
      console.error(line);
      return;
    }

    if (level === 'warn') {
      console.warn(line);
      return;
    }

    console.log(line);
  }

  private shouldLog(level: LogLevel): boolean {
    const configuredLevel = (
      this.configService.get<string>('LOG_LEVEL') ?? 'info'
    ).toLowerCase() as LogLevel;

    const threshold = LEVEL_PRIORITY[configuredLevel] ?? LEVEL_PRIORITY.info;
    return LEVEL_PRIORITY[level] >= threshold;
  }

  private sanitizeValue(value: unknown, depth = 0): unknown {
    if (depth > 5) {
      return '[Truncated]';
    }

    if (value === null || value === undefined) {
      return value;
    }

    if (value instanceof Error) {
      return {
        name: value.name,
        message: value.message,
      };
    }

    if (Array.isArray(value)) {
      return value.map((item) => this.sanitizeValue(item, depth + 1));
    }

    if (typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const sanitized: Record<string, unknown> = {};
      for (const [key, item] of Object.entries(record)) {
        if (this.isSensitiveKey(key)) {
          sanitized[key] = '[REDACTED]';
          continue;
        }

        sanitized[key] = this.sanitizeValue(item, depth + 1);
      }
      return sanitized;
    }

    if (typeof value === 'string' && value.length > 2048) {
      return `${value.slice(0, 2048)}...[truncated]`;
    }

    return value;
  }

  private isSensitiveKey(key: string): boolean {
    return SENSITIVE_KEY_PATTERNS.some((pattern) => pattern.test(key));
  }

  private normalizeMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }

    if (message instanceof Error) {
      return message.message;
    }

    if (typeof message === 'object') {
      try {
        return JSON.stringify(this.sanitizeValue(message));
      } catch {
        return '[Unserializable object message]';
      }
    }

    return String(message);
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
  }
}
