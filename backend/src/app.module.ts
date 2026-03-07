import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { validateEnvironment } from './common/config/env.validation';
import { RequestLoggingInterceptor } from './common/interceptors/request-logging.interceptor';
import { LoggingModule } from './common/logging/logging.module';
import { RequestContextMiddleware } from './common/middleware/request-context.middleware';
import { PrismaModule } from './common/prisma/prisma.module';
import { RedisModule } from './common/redis/redis.module';
import { SecurityHeadersMiddleware } from './common/middleware/security-headers.middleware';
import { EmailModule } from './common/email/email.module';
import { HealthModule } from './health/health.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ServicesModule } from './modules/services/services.module';
import { BranchesModule } from './modules/branches/branches.module';
import { AvailabilityModule } from './modules/availability/availability.module';
import { BookingsModule } from './modules/bookings/bookings.module';
import { VendorsModule } from './modules/vendors/vendors.module';
import { AdminModule } from './modules/admin/admin.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { AiModule } from './modules/ai/ai.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnvironment,
    }),
    LoggingModule,
    PrismaModule,
    RedisModule,
    EmailModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ServicesModule,
    BranchesModule,
    AvailabilityModule,
    BookingsModule,
    VendorsModule,
    AdminModule,
    NotificationsModule,
    UploadsModule,
    AiModule,
  ],
  providers: [
    RequestContextMiddleware,
    {
      provide: APP_INTERCEPTOR,
      useClass: RequestLoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(RequestContextMiddleware, SecurityHeadersMiddleware)
      .forRoutes('*');
  }
}
