import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { OtpPurpose, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { createHash } from 'crypto';
import { authenticator } from 'otplib';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';
import { resetE2eDatabase } from './helpers/e2e-db-reset';

describe('Auth (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;
  let adminId: number;

  const customerEmail = 'customer@example.com';
  const customerPhone = '+962700000001';
  const vendorEmail = 'vendor@example.com';
  const pendingVendorEmail = 'vendor-pending@example.com';
  const adminEmail = 'admin@example.com';
  const password = 'Password123!';
  const adminTotpSecret = 'JBSWY3DPEHPK3PXP';

  beforeAll(async () => {
    process.env.NODE_ENV = 'test';
    process.env.JWT_ACCESS_SECRET = 'test-access-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.ACCESS_TOKEN_TTL_MIN = '15';
    process.env.REFRESH_TOKEN_TTL_DAYS = '14';
    process.env.COOKIE_NAME_REFRESH = 'atspaces_rt';
    process.env.COOKIE_SECURE = 'true';
    process.env.COOKIE_SAMESITE = 'Strict';
    process.env.HCAPTCHA_TEST_BYPASS = 'true';
    process.env.ADMIN_INACTIVITY_TTL_MIN = '30';

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );

    const swaggerConfig = new DocumentBuilder()
      .setTitle('At Spaces API')
      .setVersion('1.0.0')
      .build();
    const swaggerDoc = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, swaggerDoc);

    await app.init();

    prisma = app.get(PrismaService);
    redis = app.get(RedisService);
  });

  beforeEach(async () => {
    await redis.getClient().flushdb();
    await resetE2eDatabase(prisma);

    const customerPasswordHash = await bcrypt.hash(password, 12);
    const vendorPasswordHash = await bcrypt.hash(password, 12);
    const adminPasswordHash = await bcrypt.hash(password, 12);

    await prisma.user.create({
      data: {
        role: Role.customer,
        fullName: 'Test Customer',
        email: customerEmail,
        passwordHash: customerPasswordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        role: Role.customer,
        fullName: 'Test Customer Phone',
        phoneNumber: customerPhone,
        status: UserStatus.active,
        isPhoneVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        role: Role.vendor,
        fullName: 'Test Vendor',
        email: vendorEmail,
        passwordHash: vendorPasswordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        role: Role.vendor,
        fullName: 'Pending Vendor',
        email: pendingVendorEmail,
        passwordHash: vendorPasswordHash,
        status: UserStatus.pending,
        isEmailVerified: true,
      },
    });

    const admin = await prisma.user.create({
      data: {
        role: Role.admin,
        fullName: 'Test Admin',
        email: adminEmail,
        passwordHash: adminPasswordHash,
        status: UserStatus.active,
        isEmailVerified: true,
        mfaEnabled: true,
        mfaSecretEnc: adminTotpSecret,
      },
    });
    adminId = admin.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('customer email login works', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/customer/login-email')
      .send({ email: customerEmail, password })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.role).toBe('customer');
    expect(response.headers['set-cookie']).toBeDefined();
    const cookie = response.headers['set-cookie'][0];
    expect(cookie).toContain('HttpOnly');
    expect(cookie).toContain('Secure');
    expect(cookie).toContain('SameSite=Strict');
    expect(cookie).toContain('Path=/api');
  });

  it('vendor email login works', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/vendor/login')
      .send({ email: vendorEmail, password })
      .expect(200);

    expect(response.body.accessToken).toBeDefined();
    expect(response.body.user.role).toBe('vendor');
  });

  it('pending vendor login is blocked until approval', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/vendor/login')
      .send({ email: pendingVendorEmail, password })
      .expect(403);
  });

  it('admin login returns preAuthToken', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({
        email: adminEmail,
        password,
        captchaToken: 'test-pass',
      })
      .expect(200);

    expect(response.body.preAuthToken).toBeDefined();
    expect(response.body.mfaRequired).toBe(true);
  });

  it('admin MFA verify returns access token', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({
        email: adminEmail,
        password,
        captchaToken: 'test-pass',
      })
      .expect(200);

    const totpCode = authenticator.generate(adminTotpSecret);
    const verify = await request(app.getHttpServer())
      .post('/api/admin/auth/mfa/verify')
      .send({
        preAuthToken: login.body.preAuthToken,
        totpCode,
      })
      .expect(200);

    expect(verify.body.accessToken).toBeDefined();
    expect(verify.body.user.role).toBe('admin');
    expect(verify.headers['set-cookie']).toBeDefined();
  });

  it('lockout triggers exactly at 5 failed attempts', async () => {
    for (let i = 0; i < 5; i += 1) {
      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({
          email: adminEmail,
          password: 'WrongPassword123!',
          captchaToken: 'test-pass',
        })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({
        email: adminEmail,
        password,
        captchaToken: 'test-pass',
      })
      .expect(403);

    const lockoutEvents = await prisma.securityEvent.count({
      where: { eventType: 'lockout' },
    });
    expect(lockoutEvents).toBeGreaterThan(0);
  });

  it('captcha required after 3 failed attempts', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post('/api/admin/auth/login')
        .send({
          email: adminEmail,
          password: 'WrongPassword123!',
          captchaToken: 'test-pass',
        })
        .expect(401);
    }

    await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({
        email: adminEmail,
        password: 'WrongPassword123!',
        captchaToken: 'bad-token',
      })
      .expect(400);
  });

  it('refresh token rotation works', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/customer/login-email')
      .send({ email: customerEmail, password })
      .expect(200);

    const oldCookie = login.headers['set-cookie'][0].split(';')[0];

    const refreshOne = await request(app.getHttpServer())
      .post('/api/auth/customer/refresh')
      .set('Cookie', oldCookie)
      .expect(200);

    const newCookie = refreshOne.headers['set-cookie'][0].split(';')[0];
    expect(refreshOne.body.accessToken).toBeDefined();
    expect(newCookie).not.toEqual(oldCookie);

    await request(app.getHttpServer())
      .post('/api/auth/customer/refresh')
      .set('Cookie', newCookie)
      .expect(200);
  });

  it('revoked refresh token cannot be reused', async () => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/customer/login-email')
      .send({ email: customerEmail, password })
      .expect(200);

    const oldCookie = login.headers['set-cookie'][0].split(';')[0];

    await request(app.getHttpServer())
      .post('/api/auth/customer/refresh')
      .set('Cookie', oldCookie)
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/customer/refresh')
      .set('Cookie', oldCookie)
      .expect(401);
  });

  it('admin reset requires valid TOTP', async () => {
    const resetToken = 'test-reset-token-12345678901234567890';
    const resetHash = createHash('sha256').update(resetToken).digest('hex');

    await prisma.otpSession.create({
      data: {
        userId: adminId,
        email: adminEmail,
        purpose: OtpPurpose.reset_password,
        codeHash: resetHash,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
        maxAttempts: 1,
      },
    });

    await request(app.getHttpServer())
      .post('/api/admin/auth/reset-password')
      .send({
        resetToken,
        newPassword: 'NewPassword123!',
        totpCode: '000000',
      })
      .expect(401);
  });

  it(
    'customer login endpoint is rate-limited per IP',
    async () => {
      for (let i = 0; i < 20; i += 1) {
        await request(app.getHttpServer())
          .post('/api/auth/customer/login-email')
          .send({ email: customerEmail, password: 'WrongPassword123!' })
          .expect(401);
      }

      await request(app.getHttpServer())
        .post('/api/auth/customer/login-email')
        .send({ email: customerEmail, password: 'WrongPassword123!' })
        .expect(429);
    },
    30000,
  );

  it('resend OTP endpoint is rate-limited per IP', async () => {
    for (let i = 0; i < 20; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/customer/resend-otp')
        .send({ phoneNumber: customerPhone, purpose: 'login' })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/auth/customer/resend-otp')
      .send({ phoneNumber: customerPhone, purpose: 'login' })
      .expect(429);
  });

  it('forgot password endpoint is rate-limited', async () => {
    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post('/api/auth/customer/forgot-password')
        .send({ email: customerEmail })
        .expect(200);
    }

    await request(app.getHttpServer())
      .post('/api/auth/customer/forgot-password')
      .send({ email: customerEmail })
      .expect(429);
  });

  it('phase 2 auth/profile endpoints exist in swagger docs', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const paths = response.body.paths as Record<string, unknown>;

    const expectedPaths = [
      '/api/auth/customer/register-email',
      '/api/auth/customer/register-phone',
      '/api/auth/customer/verify-otp',
      '/api/auth/customer/login-email',
      '/api/auth/customer/resend-otp',
      '/api/auth/customer/refresh',
      '/api/auth/customer/logout',
      '/api/vendors/register',
      '/api/auth/vendor/login',
      '/api/auth/vendor/refresh',
      '/api/auth/vendor/logout',
      '/api/admin/auth/login',
      '/api/admin/auth/mfa/verify',
      '/api/admin/auth/refresh',
      '/api/admin/auth/logout',
      '/api/auth/customer/forgot-password',
      '/api/auth/customer/reset-password',
      '/api/auth/vendor/forgot-password',
      '/api/auth/vendor/reset-password',
      '/api/admin/auth/forgot-password',
      '/api/admin/auth/reset-password',
      '/api/users/me',
    ];

    for (const path of expectedPaths) {
      expect(paths[path]).toBeDefined();
    }
  });
});
