import { Injectable } from '@nestjs/common';
import {
  Prisma,
  SecurityEventOutcome,
  SecurityEventType,
} from '@prisma/client';
import { createHash } from 'crypto';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RequestMeta } from './auth.types';

export interface SecurityEventInput {
  eventType: SecurityEventType;
  outcome: SecurityEventOutcome;
  userId?: number | null;
  email?: string | null;
  metadata?: Record<string, unknown>;
  requestMeta: RequestMeta;
}

@Injectable()
export class SecurityEventsService {
  constructor(private readonly prisma: PrismaService) {}

  async log(input: SecurityEventInput): Promise<void> {
    await this.prisma.securityEvent.create({
      data: {
        eventType: input.eventType,
        outcome: input.outcome,
        userId: input.userId ?? null,
        emailHash: input.email ? this.hashEmail(input.email) : null,
        ipAddress: input.requestMeta.ipAddress,
        userAgent: input.requestMeta.userAgent,
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  hashEmail(email: string): string {
    return createHash('sha256')
      .update(email.trim().toLowerCase())
      .digest('hex');
  }
}
