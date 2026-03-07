import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  ApprovalRequestType,
  BranchStatus,
  BookingStatus,
  PriceUnit,
  Role,
  UserStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import { createHmac } from 'crypto';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';

describe('Phase 4 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  let vendorOneId: number;
  let vendorTwoId: number;
  let customerId: number;
  let branchOneId: number;
  let branchTwoId: number;
  let vendorServiceOneId: number;
  let vendorServiceTwoId: number;
  let bookingOneId: number;
  let bookingTwoId: number;

  const vendorOneEmail = 'phase4-vendor-one@example.com';
  const vendorTwoEmail = 'phase4-vendor-two@example.com';
  const customerEmail = 'phase4-customer@example.com';
  const password = 'Password123!';
  const hmacKey = 'phase4-hmac-secret';

  const loginVendor = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/vendor/login')
      .send({ email, password })
      .expect(200);

    return response.body.accessToken as string;
  };

  const toCanonicalJson = (value: unknown): string => {
    const sortValue = (input: unknown): unknown => {
      if (Array.isArray(input)) {
        return input.map((item) => sortValue(item));
      }

      if (input && typeof input === 'object') {
        const record = input as Record<string, unknown>;
        const sorted: Record<string, unknown> = {};
        for (const key of Object.keys(record).sort()) {
          sorted[key] = sortValue(record[key]);
        }
        return sorted;
      }

      return input;
    };

    return JSON.stringify(sortValue(value));
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
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "notifications",
        "audit_log",
        "security_events",
        "messages",
        "conversations",
        "service_features",
        "features",
        "branch_facilities",
        "facilities",
        "payments",
        "bookings",
        "availability",
        "vendor_service_images",
        "vendor_services",
        "service_images",
        "services",
        "approval_requests",
        "otp_sessions",
        "branches",
        "users"
      RESTART IDENTITY CASCADE
    `);

    const passwordHash = await bcrypt.hash(password, 12);

    const vendorOne = await prisma.user.create({
      data: {
        role: Role.vendor,
        fullName: 'Phase4 Vendor One',
        email: vendorOneEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });
    vendorOneId = vendorOne.id;

    const vendorTwo = await prisma.user.create({
      data: {
        role: Role.vendor,
        fullName: 'Phase4 Vendor Two',
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
        fullName: 'Phase4 Customer',
        email: customerEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });
    customerId = customer.id;

    const branchOne = await prisma.branch.create({
      data: {
        ownerId: vendorOneId,
        name: 'Vendor One Branch',
        description: 'Branch One Description',
        city: 'Amman',
        address: 'Street One',
        latitude: 31.95,
        longitude: 35.91,
        status: BranchStatus.active,
      },
    });
    branchOneId = branchOne.id;

    const branchTwo = await prisma.branch.create({
      data: {
        ownerId: vendorTwoId,
        name: 'Vendor Two Branch',
        city: 'Irbid',
        address: 'Street Two',
        status: BranchStatus.active,
      },
    });
    branchTwoId = branchTwo.id;

    const service = await prisma.service.create({
      data: {
        name: 'Meeting Room',
        description: 'Meeting rooms',
        unit: 'room',
        isActive: true,
      },
    });

    const vendorServiceOne = await prisma.vendorService.create({
      data: {
        vendorId: vendorOneId,
        branchId: branchOneId,
        serviceId: service.id,
        name: 'Meeting Room One',
        pricePerUnit: 20,
        priceUnit: PriceUnit.hour,
        maxCapacity: 10,
        isAvailable: true,
      },
    });
    vendorServiceOneId = vendorServiceOne.id;

    const vendorServiceTwo = await prisma.vendorService.create({
      data: {
        vendorId: vendorTwoId,
        branchId: branchTwoId,
        serviceId: service.id,
        name: 'Meeting Room Two',
        pricePerUnit: 30,
        priceUnit: PriceUnit.hour,
        maxCapacity: 20,
        isAvailable: true,
      },
    });
    vendorServiceTwoId = vendorServiceTwo.id;

    const now = new Date();
    const start = new Date(now.getTime() + 60 * 60 * 1000);
    const end = new Date(now.getTime() + 120 * 60 * 1000);

    const bookingOne = await prisma.booking.create({
      data: {
        bookingNumber: 'BKG-20260401-0001',
        customerId,
        vendorServiceId: vendorServiceOneId,
        branchId: branchOneId,
        startTime: start,
        endTime: end,
        quantity: 2,
        totalPrice: 40,
        currency: 'JOD',
        status: BookingStatus.pending,
        paymentStatus: 'pending',
        paymentMethod: 'cash',
      },
    });
    bookingOneId = bookingOne.id;

    const bookingTwo = await prisma.booking.create({
      data: {
        bookingNumber: 'BKG-20260401-0002',
        customerId,
        vendorServiceId: vendorServiceTwoId,
        branchId: branchTwoId,
        startTime: start,
        endTime: end,
        quantity: 8,
        totalPrice: 240,
        currency: 'JOD',
        status: BookingStatus.pending,
        paymentStatus: 'pending',
        paymentMethod: 'cash',
      },
    });
    bookingTwoId = bookingTwo.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/vendors/dashboard uses only authenticated vendor data', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    const response = await request(app.getHttpServer())
      .get('/api/vendors/dashboard')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.todayOccupancy).toBe(20);
    expect(response.body.upcomingBookings).toBe(1);
    expect(response.body.branchStatus).toBe('calm');
  });

  it('GET /api/vendors/branches/me returns only owned branches', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    const response = await request(app.getHttpServer())
      .get('/api/vendors/branches/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body).toHaveLength(1);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: branchOneId,
        name: 'Vendor One Branch',
      }),
    );
  });

  it('PUT /api/vendors/branches/:id updates owned branch', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    const response = await request(app.getHttpServer())
      .put(`/api/vendors/branches/${branchOneId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Vendor One Branch Updated',
        description: 'Updated description',
        city: 'Zarqa',
        address: 'Updated Street',
        latitude: 31.99,
        longitude: 35.88,
      })
      .expect(200);

    expect(response.body.name).toBe('Vendor One Branch Updated');
    expect(response.body.city).toBe('Zarqa');
    expect(response.body.address).toBe('Updated Street');
    expect(response.body.latitude).toBe(31.99);
    expect(response.body.longitude).toBe(35.88);

    const updatedBranch = await prisma.branch.findUnique({
      where: { id: branchOneId },
    });
    expect(updatedBranch?.name).toBe('Vendor One Branch Updated');
    expect(updatedBranch?.city).toBe('Zarqa');
  });

  it('PUT /api/vendors/branches/:id returns 403 for cross-vendor update', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .put(`/api/vendors/branches/${branchTwoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        name: 'Should Fail',
        city: 'Amman',
        address: 'No Access Street',
      })
      .expect(403);
  });

  it('GET /api/vendors/vendor-services with foreign branchId returns 403', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .get(`/api/vendors/vendor-services?branchId=${branchTwoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('GET /api/vendors/vendor-services/:id returns 403 for cross-vendor service', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .get(`/api/vendors/vendor-services/${vendorServiceTwoId}`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);
  });

  it('PUT /api/vendors/vendor-services/:id/price validates pricePerUnit > 0', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .put(`/api/vendors/vendor-services/${vendorServiceOneId}/price`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        pricePerUnit: 0,
        priceUnit: 'day',
      })
      .expect(400);
  });

  it('PUT /api/vendors/vendor-services/:id/price updates own service', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    const response = await request(app.getHttpServer())
      .put(`/api/vendors/vendor-services/${vendorServiceOneId}/price`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        pricePerUnit: 55.5,
        priceUnit: 'day',
      })
      .expect(200);

    expect(response.body.pricePerUnit).toBe(55.5);
    expect(response.body.priceUnit).toBe('day');
  });

  it('POST /api/vendors/vendor-services/:id/capacity-request creates pending request with HMAC', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    const response = await request(app.getHttpServer())
      .post(`/api/vendors/vendor-services/${vendorServiceOneId}/capacity-request`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        newCapacity: 14,
        reason: 'We added more seats',
      })
      .expect(202);

    expect(response.body.status).toBe('pending');
    expect(typeof response.body.requestId).toBe('number');

    const approvalRequest = await prisma.approvalRequest.findUnique({
      where: {
        id: response.body.requestId,
      },
    });

    expect(approvalRequest).toBeTruthy();
    expect(approvalRequest?.type).toBe(ApprovalRequestType.capacity_request);
    expect(approvalRequest?.status).toBe('pending');
    expect(approvalRequest?.vendorServiceId).toBe(vendorServiceOneId);
    expect(approvalRequest?.payloadHmac).toHaveLength(64);

    const expectedHmac = createHmac('sha256', hmacKey)
      .update(toCanonicalJson(approvalRequest?.payload))
      .digest('hex');
    expect(approvalRequest?.payloadHmac).toBe(expectedHmac);
  });

  it('POST /api/vendors/vendor-services/:id/capacity-request returns 403 for cross-vendor service', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .post(`/api/vendors/vendor-services/${vendorServiceTwoId}/capacity-request`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        newCapacity: 25,
        reason: 'Need more seats',
      })
      .expect(403);
  });

  it('POST /api/vendors/vendor-services/:id/capacity-request enforces pending limit', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    for (let i = 0; i < 3; i += 1) {
      await request(app.getHttpServer())
        .post(`/api/vendors/vendor-services/${vendorServiceOneId}/capacity-request`)
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          newCapacity: 20 + i,
          reason: `Capacity increase attempt ${i + 1}`,
        })
        .expect(202);
    }

    await request(app.getHttpServer())
      .post(`/api/vendors/vendor-services/${vendorServiceOneId}/capacity-request`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        newCapacity: 99,
        reason: 'This should exceed pending limit',
      })
      .expect(409);
  });

  it('PUT /api/vendors/availability validates slot windows', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .put('/api/vendors/availability')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorServiceId: vendorServiceOneId,
        date: '2026-04-10',
        slots: [{ start: '12:00', end: '10:00', availableUnits: 5 }],
      })
      .expect(400);
  });

  it('PUT /api/vendors/availability returns 403 for cross-vendor service', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .put('/api/vendors/availability')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorServiceId: vendorServiceTwoId,
        date: '2026-04-10',
        slots: [{ start: '10:00', end: '12:00', availableUnits: 5 }],
      })
      .expect(403);
  });

  it('GET /api/vendors/bookings returns only authenticated vendor bookings', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    const response = await request(app.getHttpServer())
      .get('/api/vendors/bookings?page=1&limit=50')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0].vendorServiceId).toBe(vendorServiceOneId);
  });

  it('PATCH /api/vendors/bookings/:id/status blocks cross-vendor access', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .patch(`/api/vendors/bookings/${bookingTwoId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'completed' })
      .expect(403);
  });

  it('PATCH /api/vendors/bookings/:id/status updates own booking', async () => {
    const accessToken = await loginVendor(vendorOneEmail);

    await request(app.getHttpServer())
      .patch(`/api/vendors/bookings/${bookingOneId}/status`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ status: 'completed' })
      .expect(200);

    const updated = await prisma.booking.findUnique({ where: { id: bookingOneId } });
    expect(updated?.status).toBe('completed');
  });

  it('phase 4 endpoints exist in swagger docs', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const paths = response.body.paths as Record<string, unknown>;

    const expectedPaths = [
      '/api/vendors/dashboard',
      '/api/vendors/branches/me',
      '/api/vendors/branches/{id}',
      '/api/vendors/vendor-services',
      '/api/vendors/vendor-services/{id}',
      '/api/vendors/vendor-services/{id}/price',
      '/api/vendors/vendor-services/{id}/capacity-request',
      '/api/vendors/availability',
      '/api/vendors/bookings',
      '/api/vendors/bookings/{id}/status',
    ];

    for (const path of expectedPaths) {
      expect(paths[path]).toBeDefined();
    }
  });
});
