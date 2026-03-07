import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { StandardExceptionFilter } from '../src/common/filters/standard-exception.filter';

describe('Health (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    app.useGlobalFilters(new StandardExceptionFilter(false));
    await app.init();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('/api/health (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/health')
      .expect(200)
      .expect({ status: 'ok' });
  });

  it('/api/version (GET)', async () => {
    await request(app.getHttpServer())
      .get('/api/version')
      .expect(200)
      .expect({ version: '1.0.0' });
  });

  it('security headers are present', async () => {
    const response = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
    expect(response.headers['content-security-policy']).toBeDefined();
    expect(response.headers['referrer-policy']).toBe('no-referrer');
  });

  it('returns standard error envelope for validation errors', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/availability/check')
      .send({
        vendorServiceId: 1,
        startTime: '2026-03-05T12:00:00Z',
        endTime: '2026-03-05T10:00:00Z',
        quantity: 0,
      })
      .expect(400);

    expect(response.body).toEqual(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        message: expect.any(String),
        details: expect.any(Array),
      }),
    );
  });
});
