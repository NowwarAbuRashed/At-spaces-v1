import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface ErrorDetailItem {
  field: string;
  issue: string;
}

@Catch()
export class StandardExceptionFilter implements ExceptionFilter {
  constructor(private readonly isProduction: boolean) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();

    const { statusCode, message, details } = this.normalizeException(exception);
    const code = this.statusToCode(statusCode);

    response.status(statusCode).json({
      code,
      message,
      ...(details.length > 0 ? { details } : {}),
    });
  }

  private normalizeException(exception: unknown): {
    statusCode: number;
    message: string;
    details: ErrorDetailItem[];
  } {
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const response = exception.getResponse();
      const parsed = this.parseHttpResponse(response);

      return {
        statusCode,
        message: parsed.message,
        details: parsed.details,
      };
    }

    if (exception instanceof Error) {
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: this.isProduction ? 'Internal server error' : exception.message,
        details: [],
      };
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: 'Internal server error',
      details: [],
    };
  }

  private parseHttpResponse(httpResponse: string | object): {
    message: string;
    details: ErrorDetailItem[];
  } {
    if (typeof httpResponse === 'string') {
      return {
        message: httpResponse,
        details: [],
      };
    }

    const responseRecord = httpResponse as Record<string, unknown>;
    const messageValue = responseRecord.message;
    const detailsValue = responseRecord.details;

    const details = this.normalizeDetails(detailsValue, messageValue);
    const message = this.normalizeMessage(messageValue);

    return {
      message,
      details,
    };
  }

  private normalizeMessage(messageValue: unknown): string {
    if (typeof messageValue === 'string') {
      return messageValue;
    }

    if (Array.isArray(messageValue)) {
      if (messageValue.length === 0) {
        return 'Validation failed';
      }

      return String(messageValue[0]);
    }

    return 'Request failed';
  }

  private normalizeDetails(detailsValue: unknown, messageValue: unknown): ErrorDetailItem[] {
    if (Array.isArray(detailsValue)) {
      return detailsValue
        .map((item) => this.toDetailItem(item))
        .filter((item): item is ErrorDetailItem => item !== null);
    }

    if (Array.isArray(messageValue)) {
      return messageValue
        .map((item) => this.toDetailItem(item))
        .filter((item): item is ErrorDetailItem => item !== null);
    }

    return [];
  }

  private toDetailItem(value: unknown): ErrorDetailItem | null {
    if (typeof value === 'string') {
      const field = this.extractField(value);
      return {
        field,
        issue: value,
      };
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const field = typeof record.field === 'string' ? record.field : 'unknown';
      const issue = typeof record.issue === 'string' ? record.issue : 'Validation failed';
      return { field, issue };
    }

    return null;
  }

  private extractField(message: string): string {
    const [firstToken] = message.trim().split(/\s+/);
    if (!firstToken) {
      return 'unknown';
    }

    return firstToken.replace(/[^a-zA-Z0-9_.[\]-]/g, '') || 'unknown';
  }

  private statusToCode(statusCode: number): string {
    switch (statusCode) {
      case HttpStatus.BAD_REQUEST:
      case HttpStatus.UNPROCESSABLE_ENTITY:
        return 'VALIDATION_ERROR';
      case HttpStatus.UNAUTHORIZED:
        return 'UNAUTHENTICATED';
      case HttpStatus.FORBIDDEN:
        return 'UNAUTHORIZED';
      case HttpStatus.NOT_FOUND:
        return 'NOT_FOUND';
      case HttpStatus.CONFLICT:
        return 'CONFLICT';
      case HttpStatus.TOO_MANY_REQUESTS:
        return 'RATE_LIMITED';
      default:
        return statusCode >= 500 ? 'INTERNAL_ERROR' : 'REQUEST_ERROR';
    }
  }
}

