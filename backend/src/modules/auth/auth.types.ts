import { Role } from '@prisma/client';

export type AuthTokenType = 'access' | 'refresh' | 'pre_auth';

export interface TokenPayload {
  sub: number;
  role: Role;
  type: AuthTokenType;
  jti?: string;
}

export interface RequestMeta {
  ipAddress: string;
  userAgent: string;
}

