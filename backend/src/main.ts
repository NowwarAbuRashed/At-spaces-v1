import { ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import { AppModule } from './app.module';
import {
  parseBoolean,
  parseCorsOrigins,
  parseTrustProxy,
} from './common/config/runtime-config.util';
import { StandardExceptionFilter } from './common/filters/standard-exception.filter';
import { AppLogger } from './common/logging/app-logger.service';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get(ConfigService);
  const appLogger = app.get(AppLogger);
  app.useLogger(appLogger);

  const nodeEnv = configService.get<string>('NODE_ENV') ?? 'development';
  const isProduction = nodeEnv === 'production';
  const trustProxy = parseTrustProxy(configService.get<string>('TRUST_PROXY'));
  if (trustProxy !== undefined) {
    app.getHttpAdapter().getInstance().set('trust proxy', trustProxy);
  }

  const allowedOrigins = parseCorsOrigins(
    configService.get<string>('CORS_ALLOWED_ORIGINS'),
  );
  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) {
        callback(null, true);
        return;
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      if (!isProduction && allowedOrigins.length === 0) {
        callback(null, true);
        return;
      }

      callback(new Error('Origin not allowed by CORS'));
    },
    credentials: parseBoolean(
      configService.get<string>('CORS_ALLOW_CREDENTIALS'),
      true,
    ),
  });

  app.setGlobalPrefix('api');
  app.enableShutdownHooks();
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.useGlobalFilters(new StandardExceptionFilter(isProduction));

  const swaggerEnabled = parseBoolean(
    configService.get<string>('ENABLE_SWAGGER'),
    !isProduction,
  );
  if (swaggerEnabled) {
    const swaggerPath = configService.get<string>('SWAGGER_PATH') ?? 'api/docs';
    const swaggerConfig = new DocumentBuilder()
      .setTitle('At Spaces API')
      .setDescription('At Spaces backend API documentation')
      .setVersion('1.0.0')
      .addBearerAuth()
      .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup(swaggerPath, app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  const host = configService.get<string>('HOST') ?? '0.0.0.0';
  const port = Number(configService.get<string>('PORT') ?? 3000);
  await app.listen(port, host);

  appLogger.log('server_started', {
    nodeEnv,
    host,
    port,
    swaggerEnabled,
    trustProxy: trustProxy ?? false,
    corsOrigins: allowedOrigins,
  });
}

bootstrap();
