import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from './admin-auth.controller';
import { AuthService } from './auth.service';
import { CaptchaService } from './captcha.service';
import { CustomerAuthController } from './customer-auth.controller';
import { RefreshSessionService } from './refresh-session.service';
import { SecurityEventsService } from './security-events.service';
import { VendorAuthController, VendorRegistrationController } from './vendor-auth.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [JwtModule.register({}), PassportModule.register({ defaultStrategy: 'jwt' })],
  controllers: [
    CustomerAuthController,
    VendorAuthController,
    VendorRegistrationController,
    AdminAuthController,
  ],
  providers: [
    AuthService,
    CaptchaService,
    RefreshSessionService,
    SecurityEventsService,
    JwtStrategy,
  ],
  exports: [AuthService, RefreshSessionService, SecurityEventsService],
})
export class AuthModule {}

