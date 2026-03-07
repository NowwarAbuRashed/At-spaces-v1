import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { BranchStatus, PriceUnit, Role, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/common/prisma/prisma.service';
import { RedisService } from '../src/common/redis/redis.service';

describe('Phase 3 (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let redis: RedisService;

  let serviceId: number;
  let vendorServiceId: number;

  const customerOneEmail = 'phase3-customer-1@example.com';
  const customerTwoEmail = 'phase3-customer-2@example.com';
  const vendorEmail = 'phase3-vendor@example.com';
  const password = 'Password123!';
  const startTime = '2026-04-10T10:00:00.000Z';
  const endTime = '2026-04-10T12:00:00.000Z';

  const loginCustomer = async (email: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/api/auth/customer/login-email')
      .send({
        email,
        password,
      })
      .expect(200);

    return response.body.accessToken as string;
  };

  const createBooking = async (accessToken: string): Promise<number> => {
    const response = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorServiceId,
        startTime,
        endTime,
        quantity: 1,
        paymentMethod: 'cash',
      })
      .expect(201);

    return response.body.bookingId as number;
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

    await prisma.user.create({
      data: {
        role: Role.customer,
        fullName: 'Phase3 Customer One',
        email: customerOneEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });

    await prisma.user.create({
      data: {
        role: Role.customer,
        fullName: 'Phase3 Customer Two',
        email: customerTwoEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });

    const vendor = await prisma.user.create({
      data: {
        role: Role.vendor,
        fullName: 'Phase3 Vendor',
        email: vendorEmail,
        passwordHash,
        status: UserStatus.active,
        isEmailVerified: true,
      },
    });

    const branch = await prisma.branch.create({
      data: {
        ownerId: vendor.id,
        name: 'Abdali Branch',
        city: 'Amman',
        address: 'Abdali Boulevard',
        status: BranchStatus.active,
      },
    });

    const service = await prisma.service.create({
      data: {
        name: 'Hot Desk',
        description: 'Flexible desk seating',
        unit: 'seat',
        isActive: true,
      },
    });
    serviceId = service.id;

    const createdVendorService = await prisma.vendorService.create({
      data: {
        vendorId: vendor.id,
        branchId: branch.id,
        serviceId: service.id,
        name: 'Hot Desk Seats',
        pricePerUnit: 5,
        priceUnit: PriceUnit.hour,
        maxCapacity: 6,
        isAvailable: true,
      },
    });
    vendorServiceId = createdVendorService.id;

    await prisma.availability.create({
      data: {
        vendorServiceId,
        slotStart: new Date('2026-04-10T08:00:00.000Z'),
        slotEnd: new Date('2026-04-10T18:00:00.000Z'),
        availableUnits: 4,
        isBlocked: false,
      },
    });

    const facility = await prisma.facility.create({
      data: {
        name: 'WiFi',
        icon: 'wifi',
        description: 'High-speed internet',
        isActive: true,
      },
    });

    await prisma.branchFacility.create({
      data: {
        branchId: branch.id,
        facilityId: facility.id,
        isAvailable: true,
      },
    });

    await prisma.feature.create({
      data: {
        name: 'Whiteboard',
        description: 'Whiteboard available',
        isActive: true,
      },
    });

  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/services returns services list', async () => {
    const response = await request(app.getHttpServer()).get('/api/services').expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);
    expect(response.body[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        unit: expect.any(String),
      }),
    );
  });

  it('GET /api/branches returns paged branches with filters', async () => {
    const response = await request(app.getHttpServer())
      .get(`/api/branches?city=amman&serviceId=${serviceId}&page=1&limit=20`)
      .expect(200);

    expect(response.body.page).toBe(1);
    expect(response.body.limit).toBe(20);
    expect(response.body.total).toBe(1);
    expect(response.body.hasNext).toBe(false);
    expect(response.body.items).toHaveLength(1);
    expect(response.body.items[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: 'Abdali Branch',
      }),
    );
  });

  it('availability validation fails when quantity is 0', async () => {
    await request(app.getHttpServer())
      .post('/api/availability/check')
      .send({
        vendorServiceId,
        startTime,
        endTime,
        quantity: 0,
      })
      .expect(400);
  });

  it('availability validation fails when startTime >= endTime', async () => {
    await request(app.getHttpServer())
      .post('/api/availability/check')
      .send({
        vendorServiceId,
        startTime,
        endTime: startTime,
        quantity: 1,
      })
      .expect(400);
  });

  it('booking preview returns JOD currency', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/bookings/preview')
      .send({
        vendorServiceId,
        startTime,
        endTime,
        quantity: 2,
      })
      .expect(200);

    expect(response.body.currency).toBe('JOD');
    expect(typeof response.body.totalPrice).toBe('number');
    expect(response.body.totalPrice).toBeGreaterThan(0);
  });

  it('create booking succeeds', async () => {
    const accessToken = await loginCustomer(customerOneEmail);

    const response = await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorServiceId,
        startTime,
        endTime,
        quantity: 2,
        paymentMethod: 'apple_pay',
      })
      .expect(201);

    expect(response.body.bookingId).toEqual(expect.any(Number));
    expect(response.body.bookingNumber).toMatch(/^BKG-\d{8}-\d{4}$/);
    expect(response.body.totalPrice).toBeGreaterThan(0);
    expect(response.body.status).toBe('pending');
    expect(response.body.paymentStatus).toBe('pending');

    const persistedBooking = await prisma.booking.findUnique({
      where: { id: response.body.bookingId },
      include: { payments: true },
    });
    expect(persistedBooking).toBeTruthy();
    expect(persistedBooking?.paymentMethod).toBe('apple_pay');
    expect(persistedBooking?.payments).toHaveLength(1);
    expect(persistedBooking?.payments[0].method).toBe('apple_pay');
  });

  it('create booking fails when quantity is invalid', async () => {
    const accessToken = await loginCustomer(customerOneEmail);

    await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorServiceId,
        startTime,
        endTime,
        quantity: 0,
        paymentMethod: 'cash',
      })
      .expect(400);
  });

  it('create booking fails when startTime >= endTime', async () => {
    const accessToken = await loginCustomer(customerOneEmail);

    await request(app.getHttpServer())
      .post('/api/bookings')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vendorServiceId,
        startTime: endTime,
        endTime: startTime,
        quantity: 1,
        paymentMethod: 'cash',
      })
      .expect(400);
  });

  it('GET /api/bookings/:id blocks non-owner', async () => {
    const ownerToken = await loginCustomer(customerOneEmail);
    const nonOwnerToken = await loginCustomer(customerTwoEmail);
    const bookingId = await createBooking(ownerToken);

    await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}`)
      .set('Authorization', `Bearer ${nonOwnerToken}`)
      .expect(403);
  });

  it('GET /api/bookings/:id/calendar.ics blocks non-owner', async () => {
    const ownerToken = await loginCustomer(customerOneEmail);
    const nonOwnerToken = await loginCustomer(customerTwoEmail);
    const bookingId = await createBooking(ownerToken);

    await request(app.getHttpServer())
      .get(`/api/bookings/${bookingId}/calendar.ics`)
      .set('Authorization', `Bearer ${nonOwnerToken}`)
      .expect(403);
  });

  it('cancel booking blocks non-owner', async () => {
    const ownerToken = await loginCustomer(customerOneEmail);
    const nonOwnerToken = await loginCustomer(customerTwoEmail);
    const bookingId = await createBooking(ownerToken);

    await request(app.getHttpServer())
      .post(`/api/bookings/${bookingId}/cancel`)
      .set('Authorization', `Bearer ${nonOwnerToken}`)
      .expect(403);
  });

  it('phase 3 endpoints exist in swagger docs', async () => {
    const response = await request(app.getHttpServer()).get('/api/docs-json').expect(200);
    const paths = response.body.paths as Record<string, unknown>;
    const expectedPaths = [
      '/api/services',
      '/api/services/{id}',
      '/api/branches',
      '/api/branches/search',
      '/api/branches/{id}',
      '/api/facilities',
      '/api/features',
      '/api/availability/check',
      '/api/bookings/preview',
      '/api/bookings',
      '/api/bookings/my',
      '/api/bookings/{id}',
      '/api/bookings/{id}/cancel',
      '/api/bookings/{id}/calendar.ics',
    ];

    for (const path of expectedPaths) {
      expect(paths[path]).toBeDefined();
    }
  });

});
