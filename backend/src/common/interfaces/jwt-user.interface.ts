import { Role } from '@prisma/client';

export interface JwtUser {
  sub: number;
  role: Role;
  type: 'access';
}

