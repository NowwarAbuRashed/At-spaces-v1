import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  Prisma,
  ApprovalRequestType,
  ApprovalStatus,
  BranchStatus,
  BookingStatus,
  NotificationType,
  PaymentStatus,
  PriceUnit,
  Role,
  SecurityEventType,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { createHmac } from 'crypto';
import { authenticator } from 'otplib';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';
import { resetE2eDatabase } from './helpers/e2e-db-reset';

describe('Phase 5 (e2e)', () => {
  jest.setTimeout(30000);

  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  let adminId: number;
  let vendorId: number;
  let vendorTwoId: number;
  let customerId: number;
  let branchId: number;
  let secondBranchId: number;
  let vendorServiceId: number;
  let secondVendorServiceId: number;

  const adminEmail = 'phase5-admin@example.com';
  const vendorEmail = 'phase5-vendor@example.com';
  const vendorTwoEmail = 'phase5-vendor-two@example.com';
  const customerEmail = 'phase5-customer@example.com';
  const password = 'Password123!';
  const adminTotpSecret = 'JBSWY3DPEHPK3PXP';
  const hmacKey = 'phase5-hmac-secret';

  const loginAdmin = async (): Promise<string> => {
    const login = await request(app.getHttpServer())
      .post('/api/admin/auth/login')
      .send({
        email: adminEmail,
        password,
        captchaToken: 'test-pass',
      })
      .expect(200);

    const verify = await request(app.getHttpServer())
      .post('/api/admin/auth/mfa/verify')
      .send({
        preAuthToken: login.body.preAuthToken,
        totpCode: authenticator.generate(adminTotpSecret),
      })
      .expect(200);

    return verify.body.accessToken as string;
  };

  const loginVendor = async (email: string): Promise<string> => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/vendor/login')
      .send({
        email,
        password,
      })
      .expect(200);

    return login.body.accessToken as string;
  };

  const loginCustomer = async (): Promise<string> => {
    const login = await request(app.getHttpServer())
      .post('/api/auth/customer/login-email')
      .send({
        email: customerEmail,
        password,
      })
      .expect(200);

    return login.body.accessToken as string;
  };

  const signPayload = (payload: Record<string, unknown>): string => {
    const sortValue = (value: unknown): unknown => {
      if (Array.isArray(value)) {
        return value.map((item) => sortValue(item));
      }

      if (value && typeof value === 'object') {
        const record = value as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(record).sort()) {
          sorted[key] = sortValue(record[key]);
        }
        return sorted;
      }

      return value;
    };

    return createHmac('sha256', hmacKey)
      .update(JSON.stringify(sortValue(payload)))
      .digest('hex');
  };

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
    process.env.HMAC_APPROVAL_REQUESTS_KEY = hmacKey;
    process.env.REPORT_EXPORT_MOCK = 'true';

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
      .addBearerAuth()
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

    const passwordHash = await bcrypt.hash(password, 12);

    const admin = await prisma.user.create({
      data: {
        role: Role.admin,
        fullName: 'Phase5 Admin',
        email: adminEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
        mfaEnabled: true,
        mfaSecretEnc: adminTotpSecret,
      },
    });
    adminId = admin.id;

    const vendor = await prisma.user.create({
      data: {
        role: Role.vendor,
        fullName: 'Phase5 Vendor',
        email: vendorEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });
    vendorId = vendor.id;

    const vendorTwo = await prisma.user.create({
      data: {
        role: Role.vendor,
        fullName: 'Phase5 Vendor Two',
        email: vendorTwoEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });
    vendorTwoId = vendorTwo.id;

    const customer = await prisma.user.create({
      data: {
        role: Role.customer,
        fullName: 'Phase5 Customer',
        email: customerEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });
    customerId = customer.id;

    const branch = await prisma.branch.create({
      data: {
        ownerId: vendorId,
        name: 'Phase5 Branch',
        city: 'Amman',
        address: 'Main Street',
        status: BranchStatus.active,
      },
    });
    branchId = branch.id;

    const secondBranch = await prisma.branch.create({
      data: {
        ownerId: vendorTwoId,
        name: 'Phase5 Branch Two',
        city: 'Irbid',
        address: 'Second Street',
        status: BranchStatus.active,
      },
    });
    secondBranchId = secondBranch.id;

    const service = await prisma.service.create({
      data: {
        name: `Phase5 Hot Desk ${Date.now()}`,
        unit: 'seat',
        isActive: true,
      },
    });

    const vendorService = await prisma.vendorService.create({
      data: {
        vendorId,
        branchId,
        serviceId: service.id,
        name: 'Phase5 Service',
        pricePerUnit: 10,
        priceUnit: PriceUnit.hour,
        maxCapacity: 10,
        isAvailable: true,
      },
    });
    vendorServiceId = vendorService.id;

    const secondVendorService = await prisma.vendorService.create({
      data: {
        vendorId: vendorTwoId,
        branchId: secondBranchId,
        serviceId: service.id,
        name: 'Phase5 Service Two',
        pricePerUnit: 20,
        priceUnit: PriceUnit.hour,
        maxCapacity: 20,
        isAvailable: true,
      },
    });
    secondVendorServiceId = secondVendorService.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('admin access control blocks non-admin', async () => {
    const vendorAccessToken = await loginVendor(vendorEmail);

    await request(app.getHttpServer()).get('/api/admin/branches').expect(401);

    await request(app.getHttpServer())
      .get('/api/admin/branches')
      .set('Authorization', `Bearer ${vendorAccessToken}`)
      .expect(403);
  });

  it('approving capacity request updates vendor service and stores reviewer', async () => {
    const payload = {
      vendorServiceId,
      newCapacity: 25,
      reason: 'Added more seats for demand',
      requestedAt: new Date().toISOString(),
    };

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: ApprovalRequestType.capacity_request,
        status: ApprovalStatus.pending,
        vendorServiceId,
        requestedById: vendorId,
        payload: payload as unknown as Prisma.JsonObject,
        payloadHmac: signPayload(payload),
      },
    });

    const adminAccessToken = await loginAdmin();

    await request(app.getHttpServer())
      .post(`/api/admin/approval-requests/${approvalRequest.id}/approve`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    const updatedRequest = await prisma.approvalRequest.findUnique({
      where: { id: approvalRequest.id },
    });
    const updatedService = await prisma.vendorService.findUnique({
      where: { id: vendorServiceId },
    });

    expect(updatedRequest?.status).toBe(ApprovalStatus.approved);
    expect(updatedRequest?.reviewedById).toBe(adminId);
    expect(updatedRequest?.reviewedAt).toBeTruthy();
    expect(updatedService?.maxCapacity).toBe(25);
  });

  it('approval review rejects tampered payload hmac', async () => {
    const payload = {
      vendorServiceId,
      newCapacity: 25,
      reason: 'Tampered request payload',
      requestedAt: new Date().toISOString(),
    };

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: ApprovalRequestType.capacity_request,
        status: ApprovalStatus.pending,
        vendorServiceId,
        requestedById: vendorId,
        payload: payload as unknown as Prisma.JsonObject,
        payloadHmac: '0'.repeat(64),
      },
    });

    const adminAccessToken = await loginAdmin();

    await request(app.getHttpServer())
      .post(`/api/admin/approval-requests/${approvalRequest.id}/approve`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(422);
  });

  it('rejecting capacity request does not update vendor service and requires reason length >= 10', async () => {
    const payload = {
      vendorServiceId,
      newCapacity: 30,
      reason: 'Rejected request',
      requestedAt: new Date().toISOString(),
    };

    const approvalRequest = await prisma.approvalRequest.create({
      data: {
        type: ApprovalRequestType.capacity_request,
        status: ApprovalStatus.pending,
        vendorServiceId,
        requestedById: vendorId,
        payload: payload as unknown as Prisma.JsonObject,
        payloadHmac: signPayload(payload),
      },
    });

    const adminAccessToken = await loginAdmin();

    await request(app.getHttpServer())
      .post(`/api/admin/approval-requests/${approvalRequest.id}/reject`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ reason: 'short' })
      .expect(400);

    await request(app.getHttpServer())
      .post(`/api/admin/approval-requests/${approvalRequest.id}/reject`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ reason: 'Insufficient operational justification' })
      .expect(200);

    const rejectedRequest = await prisma.approvalRequest.findUnique({
      where: { id: approvalRequest.id },
    });
    const serviceAfterReject = await prisma.vendorService.findUnique({
      where: { id: vendorServiceId },
    });

    expect(rejectedRequest?.status).toBe(ApprovalStatus.rejected);
    expect(rejectedRequest?.reason).toBe('Insufficient operational justification');
    expect(serviceAfterReject?.maxCapacity).toBe(10);
  });

  it('audit log endpoint supports pagination and date filters', async () => {
    const adminAccessToken = await loginAdmin();

    await request(app.getHttpServer())
      .patch(`/api/admin/branches/${branchId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ status: 'suspended' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/api/admin/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ status: 'suspended' })
      .expect(200);

    const today = new Date().toISOString().slice(0, 10);

    const pageOne = await request(app.getHttpServer())
      .get('/api/admin/audit-log?page=1&limit=1')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(pageOne.body.page).toBe(1);
    expect(pageOne.body.limit).toBe(1);
    expect(pageOne.body.items).toHaveLength(1);
    expect(pageOne.body.total).toBeGreaterThan(1);
    expect(pageOne.body.hasNext).toBe(true);

    const filteredByDate = await request(app.getHttpServer())
      .get(`/api/admin/audit-log?page=1&limit=20&from=${today}&to=${today}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);
    expect(filteredByDate.body.items.length).toBeGreaterThan(0);
    expect(filteredByDate.body.page).toBe(1);
    expect(filteredByDate.body.limit).toBe(20);
  });

  it('analytics endpoint returns aggregated data', async () => {
    const adminAccessToken = await loginAdmin();
    const from = '2026-03-01';
    const to = '2026-03-05';

    await prisma.booking.createMany({
      data: [
        {
          bookingNumber: 'BKG-20260302-0001',
          customerId,
          vendorServiceId,
          branchId,
          startTime: new Date('2026-03-02T09:00:00.000Z'),
          endTime: new Date('2026-03-02T10:00:00.000Z'),
          quantity: 2,
          totalPrice: 20,
          currency: 'JOD',
          status: BookingStatus.confirmed,
          paymentStatus: PaymentStatus.paid,
          paymentMethod: 'cash',
          createdAt: new Date('2026-03-02T08:00:00.000Z'),
          updatedAt: new Date('2026-03-02T08:00:00.000Z'),
        },
        {
          bookingNumber: 'BKG-20260303-0001',
          customerId,
          vendorServiceId: secondVendorServiceId,
          branchId: secondBranchId,
          startTime: new Date('2026-03-03T09:00:00.000Z'),
          endTime: new Date('2026-03-03T10:00:00.000Z'),
          quantity: 3,
          totalPrice: 60,
          currency: 'JOD',
          status: BookingStatus.confirmed,
          paymentStatus: PaymentStatus.paid,
          paymentMethod: 'cash',
          createdAt: new Date('2026-03-03T08:00:00.000Z'),
          updatedAt: new Date('2026-03-03T08:00:00.000Z'),
        },
        {
          bookingNumber: 'BKG-20260304-0001',
          customerId,
          vendorServiceId: secondVendorServiceId,
          branchId: secondBranchId,
          startTime: new Date('2026-03-04T09:00:00.000Z'),
          endTime: new Date('2026-03-04T10:00:00.000Z'),
          quantity: 1,
          totalPrice: 60,
          currency: 'JOD',
          status: BookingStatus.pending,
          paymentStatus: PaymentStatus.pending,
          paymentMethod: 'cash',
          createdAt: new Date('2026-03-04T08:00:00.000Z'),
          updatedAt: new Date('2026-03-04T08:00:00.000Z'),
        },
      ],
    });

    const response = await request(app.getHttpServer())
      .get(`/api/admin/analytics?from=${from}&to=${to}`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .expect(200);

    expect(response.body.totalBookings).toBe(3);
    expect(response.body.revenue).toBe(80);
    expect(typeof response.body.occupancyRate).toBe('number');
    expect(Array.isArray(response.body.topCities)).toBe(true);
    expect(response.body.topCities.length).toBeGreaterThan(0);
    expect(response.body.topCities[0]).toEqual(
      expect.objectContaining({
        city: expect.any(String),
        bookings: expect.any(Number),
      }),
    );
  });

  it('report export is admin-only and returns presigned URL', async () => {
    const adminAccessToken = await loginAdmin();
    const vendorAccessToken = await loginVendor(vendorEmail);

    await request(app.getHttpServer())
      .post('/api/admin/reports/export')
      .set('Authorization', `Bearer ${vendorAccessToken}`)
      .send({
        reportType: 'revenue',
        format: 'csv',
        filters: { from: '2026-03-01', to: '2026-03-05' },
      })
      .expect(403);

    const response = await request(app.getHttpServer())
      .post('/api/admin/reports/export')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({
        reportType: 'revenue',
        format: 'csv',
        filters: { from: '2026-03-01', to: '2026-03-05' },
      })
      .expect(200);

    expect(response.body.status).toBe('ready');
    expect(response.body.url).toContain('mock-s3.local');
    expect(response.body.expiresIn).toBeLessThanOrEqual(300);

    const exportAudit = await prisma.auditLog.findFirst({
      where: { action: 'report_exported' },
    });
    expect(exportAudit).toBeTruthy();

    const exportSecurityEvent = await prisma.securityEvent.findFirst({
      where: { eventType: SecurityEventType.report_exported },
    });
    expect(exportSecurityEvent).toBeTruthy();
  });

  it('admin vendor suspension prevents vendor login', async () => {
    const adminAccessToken = await loginAdmin();

    await request(app.getHttpServer())
      .patch(`/api/admin/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ status: 'suspended' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/auth/vendor/login')
      .send({
        email: vendorEmail,
        password,
      })
      .expect(403);
  });

  it('suspended vendor services are not bookable via availability or booking APIs', async () => {
    const adminAccessToken = await loginAdmin();
    const customerAccessToken = await loginCustomer();

    await request(app.getHttpServer())
      .patch(`/api/admin/vendors/${vendorId}/status`)
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .send({ status: 'suspended' })
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/availability/check')
      .send({
        vendorServiceId,
        startTime: '2026-04-10T10:00:00.000Z',
        endTime: '2026-04-10T12:00:00.000Z',
        quantity: 1,
      })
      .expect(404);

    await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .send({
        vendorServiceId,
        startTime: '2026-04-10T10:00:00.000Z',
        endTime: '2026-04-10T12:00:00.000Z',
        quantity: 1,
        paymentMethod: 'cash',
      })
      .expect(404);
  });

  it('notifications endpoints return user-scoped notifications and allow mark as read', async () => {
    const customerAccessToken = await loginCustomer();

    const notification = await prisma.notification.create({
      data: {
        userId: customerId,
        type: NotificationType.booking,
        title: 'Booking confirmed',
        body: 'Your booking has been confirmed.',
      },
    });

    const list = await request(app.getHttpServer())
      .get('/api/notifications?page=1&limit=20')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .expect(200);

    expect(list.body.items).toHaveLength(1);
    expect(list.body.items[0].id).toBe(notification.id);
    expect(list.body.items[0].isRead).toBe(false);

    await request(app.getHttpServer())
      .patch(`/api/notifications/${notification.id}/read`)
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .expect(200);

    const updated = await prisma.notification.findUnique({ where: { id: notification.id } });
    expect(updated?.readAt).toBeTruthy();
  });

  it('upload image endpoint allows vendor/admin and blocks customer', async () => {
    const vendorAccessToken = await loginVendor(vendorEmail);
    const adminAccessToken = await loginAdmin();
    const customerAccessToken = await loginCustomer();
    const validPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d,
    ]);

    await request(app.getHttpServer())
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${vendorAccessToken}`)
      .attach('file', validPng, 'vendor.png')
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${adminAccessToken}`)
      .attach('file', validPng, 'admin.png')
      .expect(200);

    await request(app.getHttpServer())
      .post('/api/uploads/image')
      .set('Authorization', `Bearer ${customerAccessToken}`)
      .attach('file', validPng, 'customer.png')
      .expect(403);
  });

  it('AI recommend endpoint returns 501 safe stub', async () => {
    await request(app.getHttpServer())
      .post('/api/ai/recommend')
      .send({
        query: 'quiet workspace',
        location: 'Amman',
        time: '2026-03-05T10:00:00Z',
        durationMinutes: 90,
      })
      .expect(501);
  });

  it('phase 5 admin endpoints are documented in swagger', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const paths = response.body.paths as Record<string, unknown>;
    const expectedPaths = [
      '/api/version',
      '/api/admin/approval-requests',
      '/api/admin/approval-requests/{id}',
      '/api/admin/approval-requests/{id}/approve',
      '/api/admin/approval-requests/{id}/reject',
      '/api/admin/branches',
      '/api/admin/branches/{id}/status',
      '/api/admin/vendors',
      '/api/admin/vendors/{id}/status',
      '/api/admin/analytics',
      '/api/admin/reports/export',
      '/api/admin/audit-log',
      '/api/notifications',
      '/api/notifications/{id}/read',
      '/api/uploads/image',
      '/api/ai/recommend',
    ];

    for (const path of expectedPaths) {
      expect(paths[path]).toBeDefined();
    }
  });
});
