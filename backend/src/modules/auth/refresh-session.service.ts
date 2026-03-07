import {
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Role } from '@prisma/client';
import { randomUUID } from 'crypto';
import { RedisService } from '../../common/redis/redis.service';
import {
  ADMIN_INACTIVITY_MINUTES,
  ADMIN_IP_RATE_LIMIT_MAX,
  ADMIN_IP_RATE_LIMIT_WINDOW_SECONDS,
  ADMIN_LOCKOUT_MINUTES,
} from './auth.constants';

@Injectable()
export class RefreshSessionService {
  constructor(
    private readonly redisService: RedisService,
    private readonly configService: ConfigService,
  ) {}

  getRefreshSessionTtlSeconds(): number {
    const days = Number(this.getRuntimeConfig('REFRESH_TOKEN_TTL_DAYS') ?? '14');
    return days * 24 * 60 * 60;
  }

  getClient() {
    return this.redisService.getClient();
  }

  getAdminInactivityTtlSeconds(): number {
    const envMinutes = this.getRuntimeConfig('ADMIN_INACTIVITY_TTL_MIN');
    const minutes = envMinutes ? Number(envMinutes) : ADMIN_INACTIVITY_MINUTES;
    return minutes * 60;
  }

  getAdminLockoutTtlSeconds(): number {
    return ADMIN_LOCKOUT_MINUTES * 60;
  }

  getRefreshCookieName(): string {
    return this.getRuntimeConfig('COOKIE_NAME_REFRESH') ?? 'atspaces_rt';
  }

  parseCookieSecure(): boolean {
    return (this.getRuntimeConfig('COOKIE_SECURE') ?? 'true').toLowerCase() === 'true';
  }

  parseCookieSameSite():
    | true
    | false
    | 'lax'
    | 'strict'
    | 'none'
    | undefined {
    const value = (this.getRuntimeConfig('COOKIE_SAMESITE') ?? 'Strict').toLowerCase();
    if (value === 'strict' || value === 'lax' || value === 'none') {
      return value;
    }

    return 'strict';
  }

  getCookieDomain(): string | undefined {
    const domain = this.getRuntimeConfig('COOKIE_DOMAIN');
    return domain && domain.trim().length > 0 ? domain.trim() : undefined;
  }

  getRefreshCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: true | false | 'lax' | 'strict' | 'none' | undefined;
    path: string;
    maxAge: number;
    domain?: string;
  } {
    const domain = this.getCookieDomain();
    return {
      httpOnly: true,
      secure: this.parseCookieSecure(),
      sameSite: this.parseCookieSameSite(),
      path: '/api',
      maxAge: this.getRefreshSessionTtlSeconds() * 1000,
      ...(domain ? { domain } : {}),
    };
  }

  getClearCookieOptions(): {
    httpOnly: boolean;
    secure: boolean;
    sameSite: true | false | 'lax' | 'strict' | 'none' | undefined;
    path: string;
    domain?: string;
  } {
    const domain = this.getCookieDomain();
    return {
      httpOnly: true,
      secure: this.parseCookieSecure(),
      sameSite: this.parseCookieSameSite(),
      path: '/api',
      ...(domain ? { domain } : {}),
    };
  }

  generateRefreshJti(): string {
    return randomUUID();
  }

  getRefreshSessionKey(jti: string): string {
    return `auth:refresh:session:${jti}`;
  }

  getRefreshRevokedKey(jti: string): string {
    return `auth:refresh:revoked:${jti}`;
  }

  getAdminFailKey(emailHash: string): string {
    return `auth:admin:fail:${emailHash}`;
  }

  getAdminLockoutKey(emailHash: string): string {
    return `auth:admin:lockout:${emailHash}`;
  }

  getAdminIpRateKey(ipAddress: string): string {
    return `auth:admin:ip:${ipAddress}`;
  }

  getAdminActivityKey(userId: number): string {
    return `auth:admin:lastseen:${userId}`;
  }

  getRateLimitKey(scope: string, key: string): string {
    return `auth:rate:${scope}:${key}`;
  }

  getPasswordResetRateKey(role: Role, emailHash: string): string {
    return `auth:password-reset:rate:${role}:${emailHash}`;
  }

  async saveRefreshSession(jti: string, userId: number, role: Role): Promise<void> {
    const ttl = this.getRefreshSessionTtlSeconds();
    await this.redisService
      .getClient()
      .set(this.getRefreshSessionKey(jti), JSON.stringify({ userId, role }), 'EX', ttl);
  }

  async getRefreshSession(
    jti: string,
  ): Promise<{ userId: number; role: Role } | null> {
    const raw = await this.redisService.getClient().get(this.getRefreshSessionKey(jti));
    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as { userId: number; role: Role };
    return parsed;
  }

  async revokeRefreshSession(jti: string): Promise<void> {
    const client = this.redisService.getClient();
    const ttl = this.getRefreshSessionTtlSeconds();

    await client
      .multi()
      .del(this.getRefreshSessionKey(jti))
      .set(this.getRefreshRevokedKey(jti), '1', 'EX', ttl)
      .exec();
  }

  async rotateRefreshSession(oldJti: string, newJti: string, userId: number, role: Role): Promise<void> {
    const client = this.redisService.getClient();
    const ttl = this.getRefreshSessionTtlSeconds();

    await client
      .multi()
      .del(this.getRefreshSessionKey(oldJti))
      .set(this.getRefreshRevokedKey(oldJti), '1', 'EX', ttl)
      .set(
        this.getRefreshSessionKey(newJti),
        JSON.stringify({ userId, role }),
        'EX',
        ttl,
      )
      .exec();
  }

  async isRefreshRevoked(jti: string): Promise<boolean> {
    const value = await this.redisService.getClient().exists(this.getRefreshRevokedKey(jti));
    return value === 1;
  }

  async touchAdminActivity(userId: number): Promise<void> {
    await this.redisService
      .getClient()
      .set(
        this.getAdminActivityKey(userId),
        Date.now().toString(),
        'EX',
        this.getAdminInactivityTtlSeconds(),
      );
  }

  async hasActiveAdminActivity(userId: number): Promise<boolean> {
    const value = await this.redisService
      .getClient()
      .exists(this.getAdminActivityKey(userId));
    return value === 1;
  }

  async incrementAdminIpRate(ipAddress: string): Promise<number> {
    const key = this.getAdminIpRateKey(ipAddress);
    const client = this.redisService.getClient();
    const count = await client.incr(key);
    if (count === 1) {
      await client.expire(key, ADMIN_IP_RATE_LIMIT_WINDOW_SECONDS);
    }
    return count;
  }

  async ensureAdminIpRate(ipAddress: string): Promise<void> {
    const count = await this.incrementAdminIpRate(ipAddress);
    if (count > ADMIN_IP_RATE_LIMIT_MAX) {
      throw new HttpException(
        'Too many login attempts from this IP',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  async incrementRateLimit(scope: string, key: string, windowSeconds: number): Promise<number> {
    const redisKey = this.getRateLimitKey(scope, key);
    const client = this.redisService.getClient();
    const count = await client.incr(redisKey);
    if (count === 1) {
      await client.expire(redisKey, windowSeconds);
    }
    return count;
  }

  async ensureRateLimit(
    scope: string,
    key: string,
    max: number,
    windowSeconds: number,
    message: string,
  ): Promise<void> {
    const count = await this.incrementRateLimit(scope, key, windowSeconds);
    if (count > max) {
      throw new HttpException(message, HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  async incrementAdminFailedCount(emailHash: string): Promise<number> {
    const key = this.getAdminFailKey(emailHash);
    const count = await this.redisService.getClient().incr(key);
    if (count === 1) {
      await this.redisService.getClient().expire(key, this.getAdminLockoutTtlSeconds());
    }
    return count;
  }

  async getAdminFailedCount(emailHash: string): Promise<number> {
    const value = await this.redisService.getClient().get(this.getAdminFailKey(emailHash));
    return value ? Number(value) : 0;
  }

  async setAdminLockout(emailHash: string): Promise<void> {
    await this.redisService
      .getClient()
      .set(this.getAdminLockoutKey(emailHash), '1', 'EX', this.getAdminLockoutTtlSeconds());
  }

  async clearAdminFailures(emailHash: string): Promise<void> {
    await this.redisService
      .getClient()
      .del(this.getAdminFailKey(emailHash), this.getAdminLockoutKey(emailHash));
  }

  async isAdminLocked(emailHash: string): Promise<boolean> {
    return (
      (await this.redisService.getClient().exists(this.getAdminLockoutKey(emailHash))) ===
      1
    );
  }

  async ensureAdminActiveSession(userId: number, jti: string): Promise<void> {
    const active = await this.hasActiveAdminActivity(userId);
    if (!active) {
      await this.revokeRefreshSession(jti);
      throw new UnauthorizedException('Admin session expired due to inactivity');
    }
  }

  private getRuntimeConfig(key: string): string | undefined {
    const runtimeValue = process.env[key];
    if (runtimeValue !== undefined) {
      return runtimeValue;
    }

    return this.configService.get<string>(key);
  }
}
