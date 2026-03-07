import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ApprovalRequestType,
  ApprovalStatus,
  BranchStatus,
  OtpPurpose,
  Prisma,
  Role,
  SecurityEventOutcome,
  SecurityEventType,
  User,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { authenticator } from 'otplib';
import { createHash, createHmac, randomBytes } from 'crypto';
import { EmailService } from '../../common/email/email.service';
import { PrismaService } from '../../common/prisma/prisma.service';
import {
  AUTH_LOGIN_RATE_MAX,
  AUTH_LOGIN_RATE_WINDOW_SECONDS,
  OTP_RATE_MAX,
  OTP_RATE_WINDOW_SECONDS,
  PASSWORD_RESET_RATE_MAX,
  PASSWORD_RESET_RATE_WINDOW_SECONDS,
  ADMIN_CAPTCHA_THRESHOLD,
  ADMIN_LOGIN_MAX_ATTEMPTS,
  OTP_TTL_MINUTES,
  PRE_AUTH_TOKEN_TTL_MINUTES,
  RESET_REQUEST_LIMIT_PER_HOUR,
  RESET_TOKEN_TTL_MINUTES,
} from './auth.constants';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminMfaVerifyDto } from './dto/admin-mfa-verify.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { RegisterPhoneDto } from './dto/register-phone.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { OtpVerifyPurpose, VerifyOtpDto } from './dto/verify-otp.dto';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import { CaptchaService } from './captcha.service';
import { RefreshSessionService } from './refresh-session.service';
import { SecurityEventsService } from './security-events.service';
import { RequestMeta, TokenPayload } from './auth.types';

interface AuthResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    role: Role;
    fullName: string;
  };
}

interface RefreshResult {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  private readonly fakePasswordHash =
    '$2b$12$8M9ZhDJW60Trw7P3cu6UQe9EZRmIl6Ie8f8.KQ9TKM4RJPUdV20Qy';

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly refreshSessionService: RefreshSessionService,
    private readonly securityEventsService: SecurityEventsService,
    private readonly captchaService: CaptchaService,
    private readonly emailService: EmailService,
  ) {}

  getRefreshCookieName(): string {
    return this.refreshSessionService.getRefreshCookieName();
  }

  getRefreshCookieOptions() {
    return this.refreshSessionService.getRefreshCookieOptions();
  }

  getClearCookieOptions() {
    return this.refreshSessionService.getClearCookieOptions();
  }

  async registerCustomerEmail(dto: RegisterEmailDto): Promise<{
    userId: number;
    message: string;
  }> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);
    const user = await this.prisma.user.create({
      data: {
        role: Role.customer,
        fullName: dto.fullName,
        email,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });

    return {
      userId: user.id,
      message: 'Account created',
    };
  }

  async registerCustomerPhone(
    dto: RegisterPhoneDto,
    requestMeta: RequestMeta,
  ): Promise<{ message: string }> {
    await this.refreshSessionService.ensureRateLimit(
      'otp:register-phone',
      this.rateLimitKeyPart('ip', requestMeta.ipAddress),
      OTP_RATE_MAX,
      OTP_RATE_WINDOW_SECONDS,
      'Too many OTP requests',
    );

    const existing = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (existing && existing.role !== Role.customer) {
      throw new ConflictException('Phone number already in use');
    }

    const user =
      existing ??
      (await this.prisma.user.create({
        data: {
          role: Role.customer,
          fullName: dto.fullName,
          phoneNumber: dto.phoneNumber,
          status: UserStatus.pending,
          isPhoneVerified: false,
        },
      }));

    if (existing) {
      await this.prisma.user.update({
        where: { id: existing.id },
        data: { fullName: dto.fullName },
      });
    }

    await this.createOtpSession(user.id, dto.phoneNumber, OtpPurpose.signup);
    return { message: 'OTP sent' };
  }

  async verifyCustomerOtp(dto: VerifyOtpDto, requestMeta: RequestMeta): Promise<AuthResult> {
    await this.refreshSessionService.ensureRateLimit(
      'otp:verify',
      this.rateLimitKeyPart('ip', requestMeta.ipAddress),
      OTP_RATE_MAX,
      OTP_RATE_WINDOW_SECONDS,
      'Too many OTP verification attempts',
    );

    const otpSession = await this.getValidOtpSession(
      dto.phoneNumber,
      dto.purpose as OtpPurpose,
    );

    const otpHash = this.hashValue(dto.otpCode);
    if (otpSession.codeHash !== otpHash) {
      await this.prisma.otpSession.update({
        where: { id: otpSession.id },
        data: { attempts: { increment: 1 } },
      });
      throw new UnauthorizedException('Invalid OTP code');
    }

    await this.prisma.otpSession.update({
      where: { id: otpSession.id },
      data: { consumedAt: new Date() },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: otpSession.userId ?? -1 },
    });

    if (!user || user.role !== Role.customer || user.deletedAt) {
      throw new UnauthorizedException('Invalid OTP session');
    }

    if (dto.purpose === OtpVerifyPurpose.signup) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          isPhoneVerified: true,
          status: UserStatus.active,
        },
      });
    }

    const refreshedUser = await this.prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });

    return this.issueSessionTokens(refreshedUser);
  }

  async resendCustomerOtp(dto: ResendOtpDto, requestMeta: RequestMeta): Promise<{ message: string }> {
    await this.refreshSessionService.ensureRateLimit(
      'otp:resend',
      this.rateLimitKeyPart('ip', requestMeta.ipAddress),
      OTP_RATE_MAX,
      OTP_RATE_WINDOW_SECONDS,
      'Too many OTP resend attempts',
    );

    const user = await this.prisma.user.findUnique({
      where: { phoneNumber: dto.phoneNumber },
    });

    if (!user || user.role !== Role.customer || user.deletedAt) {
      throw new NotFoundException('Customer not found');
    }

    await this.createOtpSession(user.id, dto.phoneNumber, dto.purpose as OtpPurpose);
    return { message: 'OTP resent' };
  }

  async customerLoginEmail(
    dto: LoginEmailDto,
    requestMeta: RequestMeta,
  ): Promise<AuthResult> {
    return this.loginWithEmail(dto, Role.customer, requestMeta);
  }

  async customerRefresh(refreshToken: string): Promise<RefreshResult> {
    return this.refreshByRole(refreshToken, Role.customer);
  }

  async customerLogout(
    refreshToken: string | undefined,
    requestMeta: RequestMeta,
  ): Promise<{ message: string }> {
    await this.logoutByRole(refreshToken, Role.customer, requestMeta);
    return { message: 'Logged out' };
  }

  async vendorRegister(dto: VendorRegisterDto): Promise<{ message: string }> {
    const email = this.normalizeEmail(dto.email);
    const existing = await this.prisma.user.findUnique({ where: { email } });
    if (existing && !existing.deletedAt) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, 12);

    await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          role: Role.vendor,
          fullName: dto.fullName,
          email,
          passwordHash,
          status: UserStatus.pending,
          isEmailVerified: false,
        },
      });

      const branch = await tx.branch.create({
        data: {
          ownerId: user.id,
          name: dto.branch.name,
          city: dto.branch.city,
          address: dto.branch.address,
          latitude: dto.branch.latitude ?? null,
          longitude: dto.branch.longitude ?? null,
          status: BranchStatus.pending,
        },
      });

      const payload = {
        branch: {
          name: dto.branch.name,
          city: dto.branch.city,
          address: dto.branch.address,
          latitude: dto.branch.latitude ?? null,
          longitude: dto.branch.longitude ?? null,
        },
        requestedAt: new Date().toISOString(),
      };

      await tx.approvalRequest.create({
        data: {
          type: ApprovalRequestType.vendor_registration,
          status: ApprovalStatus.pending,
          branchId: branch.id,
          requestedById: user.id,
          payload: payload as Prisma.InputJsonValue,
          payloadHmac: this.signApprovalPayload(payload),
        },
      });
    });

    return { message: 'Vendor registration submitted for approval' };
  }

  async vendorLogin(dto: LoginEmailDto, requestMeta: RequestMeta): Promise<AuthResult> {
    return this.loginWithEmail(dto, Role.vendor, requestMeta);
  }

  async vendorRefresh(refreshToken: string): Promise<RefreshResult> {
    return this.refreshByRole(refreshToken, Role.vendor);
  }

  async vendorLogout(
    refreshToken: string | undefined,
    requestMeta: RequestMeta,
  ): Promise<{ message: string }> {
    await this.logoutByRole(refreshToken, Role.vendor, requestMeta);
    return { message: 'Logged out' };
  }

  async adminLogin(
    dto: AdminLoginDto,
    requestMeta: RequestMeta,
  ): Promise<{ preAuthToken: string; mfaRequired: boolean }> {
    const email = this.normalizeEmail(dto.email);
    const emailHash = this.securityEventsService.hashEmail(email);

    try {
      await this.refreshSessionService.ensureAdminIpRate(requestMeta.ipAddress);
    } catch (error) {
      await this.securityEventsService.log({
        eventType: SecurityEventType.login_failed,
        outcome: SecurityEventOutcome.blocked,
        email,
        requestMeta,
        metadata: { reason: 'ip_rate_limited' },
      });
      throw error;
    }

    if (await this.refreshSessionService.isAdminLocked(emailHash)) {
      await this.securityEventsService.log({
        eventType: SecurityEventType.lockout,
        outcome: SecurityEventOutcome.blocked,
        email,
        requestMeta,
        metadata: { reason: 'account_locked' },
      });
      throw new ForbiddenException('Account locked. Try again later.');
    }

    const failedCount = await this.refreshSessionService.getAdminFailedCount(emailHash);
    if (failedCount >= ADMIN_CAPTCHA_THRESHOLD) {
      const captchaOk = await this.captchaService.verifyToken(
        dto.captchaToken,
        requestMeta.ipAddress,
      );
      if (!captchaOk) {
        await this.securityEventsService.log({
          eventType: SecurityEventType.login_failed,
          outcome: SecurityEventOutcome.blocked,
          email,
          requestMeta,
          metadata: { reason: 'captcha_required' },
        });
        throw new BadRequestException('Captcha verification required');
      }
    }

    const admin = await this.prisma.user.findFirst({
      where: {
        email,
        role: Role.admin,
        status: UserStatus.active,
        deletedAt: null,
      },
    });

    const passwordHash = admin?.passwordHash ?? this.fakePasswordHash;
    const isValidPassword = await bcrypt.compare(dto.password, passwordHash);

    if (!admin || !isValidPassword) {
      const attempts = await this.refreshSessionService.incrementAdminFailedCount(emailHash);
      await this.securityEventsService.log({
        eventType: SecurityEventType.login_failed,
        outcome: SecurityEventOutcome.failure,
        email,
        requestMeta,
        metadata: { attempts },
      });

      if (attempts >= ADMIN_LOGIN_MAX_ATTEMPTS) {
        await this.refreshSessionService.setAdminLockout(emailHash);
        await this.securityEventsService.log({
          eventType: SecurityEventType.lockout,
          outcome: SecurityEventOutcome.blocked,
          email,
          requestMeta,
          metadata: { attempts },
        });
        await this.emailService.sendAdminLockoutAlert(email, requestMeta.ipAddress);
      }

      throw new UnauthorizedException('Invalid email or password');
    }

    if (!admin.mfaEnabled || !admin.mfaSecretEnc) {
      throw new ForbiddenException('Admin MFA must be enabled');
    }

    await this.refreshSessionService.clearAdminFailures(emailHash);
    const preAuthToken = await this.signPreAuthToken(admin.id, admin.role);

    return {
      preAuthToken,
      mfaRequired: true,
    };
  }

  async adminMfaVerify(
    dto: AdminMfaVerifyDto,
    requestMeta: RequestMeta,
  ): Promise<AuthResult> {
    const payload = await this.verifyPreAuthToken(dto.preAuthToken);
    if (payload.role !== Role.admin) {
      throw new UnauthorizedException('Invalid pre-auth token');
    }

    const admin = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });

    if (!admin || admin.role !== Role.admin || !admin.mfaSecretEnc) {
      throw new UnauthorizedException('Invalid pre-auth token');
    }

    const isValidTotp = authenticator.check(dto.totpCode, admin.mfaSecretEnc);
    if (!isValidTotp) {
      await this.securityEventsService.log({
        eventType: SecurityEventType.mfa_failed,
        outcome: SecurityEventOutcome.failure,
        userId: admin.id,
        email: admin.email,
        requestMeta,
      });
      throw new UnauthorizedException('Invalid TOTP code');
    }

    await this.securityEventsService.log({
      eventType: SecurityEventType.mfa_success,
      outcome: SecurityEventOutcome.success,
      userId: admin.id,
      email: admin.email,
      requestMeta,
    });

    await this.securityEventsService.log({
      eventType: SecurityEventType.login_success,
      outcome: SecurityEventOutcome.success,
      userId: admin.id,
      email: admin.email,
      requestMeta,
    });

    return this.issueSessionTokens(admin);
  }

  async adminRefresh(refreshToken: string): Promise<RefreshResult> {
    return this.refreshByRole(refreshToken, Role.admin);
  }

  async adminLogout(
    refreshToken: string | undefined,
    requestMeta: RequestMeta,
  ): Promise<{ message: string }> {
    await this.logoutByRole(refreshToken, Role.admin, requestMeta);
    return { message: 'Logged out' };
  }

  async forgotPassword(
    role: Role,
    dto: ForgotPasswordDto,
    requestMeta: RequestMeta,
  ): Promise<{ message: string }> {
    await this.refreshSessionService.ensureRateLimit(
      'password-reset:forgot',
      this.rateLimitKeyPart('ip', requestMeta.ipAddress),
      PASSWORD_RESET_RATE_MAX,
      PASSWORD_RESET_RATE_WINDOW_SECONDS,
      'Too many reset requests',
    );

    const email = this.normalizeEmail(dto.email);
    const emailHash = this.securityEventsService.hashEmail(email);
    const client = this.refreshSessionService.getClient();
    const rateKey = this.refreshSessionService.getPasswordResetRateKey(role, emailHash);
    const currentCount = await client.incr(rateKey);
    if (currentCount === 1) {
      await client.expire(rateKey, 60 * 60);
    }

    if (currentCount > RESET_REQUEST_LIMIT_PER_HOUR) {
      throw new HttpException('Too many reset requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    const user = await this.prisma.user.findFirst({
      where: { email, role, deletedAt: null },
    });

    if (user) {
      const token = this.generateSecureToken();
      const tokenHash = this.hashValue(token);

      await this.prisma.otpSession.create({
        data: {
          userId: user.id,
          email: user.email,
          purpose: OtpPurpose.reset_password,
          codeHash: tokenHash,
          expiresAt: this.minutesFromNow(RESET_TOKEN_TTL_MINUTES),
          maxAttempts: 1,
        },
      });

      await this.securityEventsService.log({
        eventType: SecurityEventType.password_reset_requested,
        outcome: SecurityEventOutcome.success,
        userId: user.id,
        email: user.email,
        requestMeta,
      });

      if (user.email) {
        await this.emailService.sendPasswordResetEmail(role, user.email, token);
      }

      if (this.configService.get<string>('NODE_ENV') === 'test') {
        await client.set(
          `auth:test:reset-token:${role}:${email}`,
          token,
          'EX',
          RESET_TOKEN_TTL_MINUTES * 60,
        );
      }
    }

    return {
      message: 'If the email exists, reset instructions were sent.',
    };
  }

  async resetPassword(
    role: 'customer' | 'vendor',
    dto: ResetPasswordDto,
    requestMeta: RequestMeta,
  ): Promise<{ message: string }> {
    await this.refreshSessionService.ensureRateLimit(
      `password-reset:reset:${role}`,
      this.rateLimitKeyPart('ip', requestMeta.ipAddress),
      PASSWORD_RESET_RATE_MAX,
      PASSWORD_RESET_RATE_WINDOW_SECONDS,
      'Too many reset attempts',
    );

    const resetSession = await this.findValidResetSession(dto.resetToken);
    const user = await this.prisma.user.findUnique({
      where: { id: resetSession.userId ?? -1 },
    });

    if (!user || user.role !== role || user.deletedAt) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.otpSession.update({
        where: { id: resetSession.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    await this.securityEventsService.log({
      eventType: SecurityEventType.password_reset_completed,
      outcome: SecurityEventOutcome.success,
      userId: user.id,
      email: user.email,
      requestMeta,
    });

    if (user.email) {
      await this.emailService.sendAdminPasswordResetAlert(user.email, requestMeta.ipAddress);
    }

    return { message: 'Password updated' };
  }

  async adminResetPassword(
    dto: AdminResetPasswordDto,
    requestMeta: RequestMeta,
  ): Promise<{ message: string }> {
    await this.refreshSessionService.ensureRateLimit(
      'password-reset:reset:admin',
      this.rateLimitKeyPart('ip', requestMeta.ipAddress),
      PASSWORD_RESET_RATE_MAX,
      PASSWORD_RESET_RATE_WINDOW_SECONDS,
      'Too many reset attempts',
    );

    const resetSession = await this.findValidResetSession(dto.resetToken);
    const user = await this.prisma.user.findUnique({
      where: { id: resetSession.userId ?? -1 },
    });

    if (!user || user.role !== Role.admin || user.deletedAt || !user.mfaSecretEnc) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const validTotp = authenticator.check(dto.totpCode, user.mfaSecretEnc);
    if (!validTotp) {
      await this.securityEventsService.log({
        eventType: SecurityEventType.mfa_failed,
        outcome: SecurityEventOutcome.failure,
        userId: user.id,
        email: user.email,
        requestMeta,
      });
      throw new UnauthorizedException('Invalid TOTP code');
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 12);
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.otpSession.update({
        where: { id: resetSession.id },
        data: { consumedAt: new Date() },
      }),
    ]);

    await this.securityEventsService.log({
      eventType: SecurityEventType.password_reset_completed,
      outcome: SecurityEventOutcome.success,
      userId: user.id,
      email: user.email,
      requestMeta,
    });

    return { message: 'Password updated' };
  }

  async touchAdminActivity(userId: number): Promise<void> {
    await this.refreshSessionService.touchAdminActivity(userId);
  }

  private async loginWithEmail(
    dto: LoginEmailDto,
    role: 'customer' | 'vendor',
    requestMeta: RequestMeta,
  ): Promise<AuthResult> {
    await this.refreshSessionService.ensureRateLimit(
      `login:${role}`,
      this.rateLimitKeyPart('ip', requestMeta.ipAddress),
      AUTH_LOGIN_RATE_MAX,
      AUTH_LOGIN_RATE_WINDOW_SECONDS,
      'Too many login attempts from this IP',
    );

    const email = this.normalizeEmail(dto.email);
    const user = await this.prisma.user.findFirst({
      where: {
        email,
        role,
        deletedAt: null,
      },
    });

    const passwordHash = user?.passwordHash ?? this.fakePasswordHash;
    const isValidPassword = await bcrypt.compare(dto.password, passwordHash);

    if (!user || !isValidPassword) {
      await this.securityEventsService.log({
        eventType: SecurityEventType.login_failed,
        outcome: SecurityEventOutcome.failure,
        email,
        requestMeta,
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    if (user.status !== UserStatus.active) {
      if (role === Role.vendor && user.status === UserStatus.pending) {
        throw new ForbiddenException('Account pending approval');
      }

      if (user.status === UserStatus.suspended) {
        throw new ForbiddenException('Account suspended');
      }

      throw new ForbiddenException('Account not active');
    }

    await this.securityEventsService.log({
      eventType: SecurityEventType.login_success,
      outcome: SecurityEventOutcome.success,
      userId: user.id,
      email: user.email,
      requestMeta,
    });

    return this.issueSessionTokens(user);
  }

  private async issueSessionTokens(user: User): Promise<AuthResult> {
    const accessToken = await this.signAccessToken(user.id, user.role);
    const refreshJti = this.refreshSessionService.generateRefreshJti();
    const refreshToken = await this.signRefreshToken(user.id, user.role, refreshJti);

    await this.refreshSessionService.saveRefreshSession(refreshJti, user.id, user.role);

    if (user.role === Role.admin) {
      await this.refreshSessionService.touchAdminActivity(user.id);
    }

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        role: user.role,
        fullName: user.fullName,
      },
    };
  }

  private async refreshByRole(refreshToken: string, role: Role): Promise<RefreshResult> {
    const payload = await this.verifyRefreshToken(refreshToken);
    if (payload.role !== role || !payload.jti) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (await this.refreshSessionService.isRefreshRevoked(payload.jti)) {
      throw new UnauthorizedException('Refresh token revoked');
    }

    const session = await this.refreshSessionService.getRefreshSession(payload.jti);
    if (!session || session.userId !== payload.sub || session.role !== role) {
      throw new UnauthorizedException('Invalid refresh session');
    }

    if (role === Role.admin) {
      await this.refreshSessionService.ensureAdminActiveSession(payload.sub, payload.jti);
    }

    const newJti = this.refreshSessionService.generateRefreshJti();
    const newAccessToken = await this.signAccessToken(payload.sub, role);
    const newRefreshToken = await this.signRefreshToken(payload.sub, role, newJti);
    await this.refreshSessionService.rotateRefreshSession(
      payload.jti,
      newJti,
      payload.sub,
      role,
    );

    if (role === Role.admin) {
      await this.refreshSessionService.touchAdminActivity(payload.sub);
    }

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  private async logoutByRole(
    refreshToken: string | undefined,
    role: Role,
    requestMeta: RequestMeta,
  ): Promise<void> {
    if (!refreshToken) {
      return;
    }

    try {
      const payload = await this.verifyRefreshToken(refreshToken);
      if (payload.role !== role || !payload.jti) {
        return;
      }

      await this.refreshSessionService.revokeRefreshSession(payload.jti);
      if (role === Role.admin) {
        await this.securityEventsService.log({
          eventType: SecurityEventType.session_revoked,
          outcome: SecurityEventOutcome.success,
          userId: payload.sub,
          requestMeta,
        });
      }
    } catch {
      return;
    }
  }

  private async createOtpSession(
    userId: number,
    phoneNumber: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    const otpCode = this.generateOtpCode();
    const codeHash = this.hashValue(otpCode);

    await this.prisma.otpSession.create({
      data: {
        userId,
        phoneNumber,
        purpose,
        codeHash,
        expiresAt: this.minutesFromNow(OTP_TTL_MINUTES),
        maxAttempts: 5,
      },
    });

    if (this.configService.get<string>('NODE_ENV') === 'test') {
      await this.refreshSessionService
        .getClient()
        .set(`auth:test:otp:${phoneNumber}:${purpose}`, otpCode, 'EX', OTP_TTL_MINUTES * 60);
    }
  }

  private async getValidOtpSession(
    phoneNumber: string,
    purpose: OtpPurpose,
  ) {
    const otpSession = await this.prisma.otpSession.findFirst({
      where: {
        phoneNumber,
        purpose,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpSession) {
      throw new UnauthorizedException('OTP session not found or expired');
    }

    if (otpSession.attempts >= otpSession.maxAttempts) {
      throw new UnauthorizedException('OTP attempts exceeded');
    }

    return otpSession;
  }

  private async findValidResetSession(resetToken: string) {
    const tokenHash = this.hashValue(resetToken);
    const resetSession = await this.prisma.otpSession.findFirst({
      where: {
        purpose: OtpPurpose.reset_password,
        codeHash: tokenHash,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!resetSession) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    return resetSession;
  }

  private async signAccessToken(userId: number, role: Role): Promise<string> {
    const ttlMinutes = Number(this.configService.get<string>('ACCESS_TOKEN_TTL_MIN') ?? '15');
    return this.jwtService.signAsync(
      {
        sub: userId,
        role,
        type: 'access',
      },
      {
        secret: this.getRequiredConfig('JWT_ACCESS_SECRET'),
        expiresIn: `${ttlMinutes}m`,
      },
    );
  }

  private async signRefreshToken(userId: number, role: Role, jti: string): Promise<string> {
    const ttlDays = Number(this.configService.get<string>('REFRESH_TOKEN_TTL_DAYS') ?? '14');
    return this.jwtService.signAsync(
      {
        sub: userId,
        role,
        type: 'refresh',
        jti,
      },
      {
        secret: this.getRequiredConfig('JWT_REFRESH_SECRET'),
        expiresIn: `${ttlDays}d`,
      },
    );
  }

  private async signPreAuthToken(userId: number, role: Role): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        role,
        type: 'pre_auth',
      },
      {
        secret: this.getRequiredConfig('JWT_ACCESS_SECRET'),
        expiresIn: `${PRE_AUTH_TOKEN_TTL_MINUTES}m`,
      },
    );
  }

  private async verifyRefreshToken(token: string): Promise<TokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.getRequiredConfig('JWT_REFRESH_SECRET'),
      });
      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid refresh token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private async verifyPreAuthToken(token: string): Promise<TokenPayload> {
    try {
      const payload = await this.jwtService.verifyAsync<TokenPayload>(token, {
        secret: this.getRequiredConfig('JWT_ACCESS_SECRET'),
      });
      if (payload.type !== 'pre_auth') {
        throw new UnauthorizedException('Invalid pre-auth token');
      }
      return payload;
    } catch {
      throw new UnauthorizedException('Invalid pre-auth token');
    }
  }

  private minutesFromNow(minutes: number): Date {
    return new Date(Date.now() + minutes * 60 * 1000);
  }

  private normalizeEmail(email: string): string {
    return email.trim().toLowerCase();
  }

  private rateLimitKeyPart(prefix: string, value: string): string {
    const normalized = value.trim().toLowerCase();
    return `${prefix}:${normalized.length > 0 ? normalized : 'unknown'}`;
  }

  private getRequiredConfig(key: string): string {
    const value = process.env[key] ?? this.configService.get<string>(key);
    if (!value || value.trim().length === 0) {
      throw new InternalServerErrorException(`Missing required config: ${key}`);
    }

    return value;
  }

  private hashValue(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }

  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateSecureToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private signApprovalPayload(payload: Record<string, unknown>): string {
    const key = this.getRequiredConfig('HMAC_APPROVAL_REQUESTS_KEY');
    return createHmac('sha256', key).update(this.toCanonicalJson(payload)).digest('hex');
  }

  private toCanonicalJson(value: unknown): string {
    return JSON.stringify(this.sortValue(value));
  }

  private sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortValue(item));
    }

    if (value && typeof value === 'object') {
      const record = value as Record<string, unknown>;
      const sortedRecord: Record<string, unknown> = {};

      for (const key of Object.keys(record).sort()) {
        sortedRecord[key] = this.sortValue(record[key]);
      }

      return sortedRecord;
    }

    return value;
  }
}
