import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { RequestContextService } from '../logging/request-context.service';

type RequestWithId = Request & { requestId?: string };

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  constructor(private readonly requestContextService: RequestContextService) {}

  use(request: RequestWithId, response: Response, next: NextFunction): void {
    const incomingRequestId = request.header('x-request-id');
    const requestId =
      typeof incomingRequestId === 'string' && incomingRequestId.trim().length > 0
        ? incomingRequestId.trim()
        : randomUUID();

    request.requestId = requestId;
    response.setHeader('X-Request-Id', requestId);

    this.requestContextService.run(requestId, next);
  }
}
