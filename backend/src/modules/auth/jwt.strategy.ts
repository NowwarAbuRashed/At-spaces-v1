import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Role } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { RefreshSessionService } from './refresh-session.service';
import { TokenPayload } from './auth.types';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private readonly configService: ConfigService,
    private readonly refreshSessionService: RefreshSessionService,
  ) {
    const accessSecret =
      process.env.JWT_ACCESS_SECRET ??
      configService.get<string>('JWT_ACCESS_SECRET');
    if (!accessSecret || accessSecret.trim().length === 0) {
      throw new Error('Missing required config: JWT_ACCESS_SECRET');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });
  }

  async validate(payload: TokenPayload): Promise<JwtUser> {
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Invalid access token');
    }

    if (!this.isValidRole(payload.role)) {
      throw new UnauthorizedException('Invalid role');
    }

    if (payload.role === Role.admin) {
      await this.refreshSessionService.touchAdminActivity(payload.sub);
    }

    return {
      sub: payload.sub,
      role: payload.role,
      type: 'access',
    };
  }

  private isValidRole(role: Role): boolean {
    return role === Role.customer || role === Role.vendor || role === Role.admin;
  }
}
