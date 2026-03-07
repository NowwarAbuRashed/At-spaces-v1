import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { RegisterEmailDto } from './dto/register-email.dto';
import { RegisterPhoneDto } from './dto/register-phone.dto';
import { ResendOtpDto } from './dto/resend-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import {
  AccessTokenResponseDto,
  AuthLoginResponseDto,
  MessageResponseDto,
  RegisterEmailResponseDto,
} from './dto/auth-response.dto';
import { Role } from '@prisma/client';

@ApiTags('Auth - Customer')
@Controller('auth/customer')
export class CustomerAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register-email')
  @ApiOperation({ summary: 'Register customer with email' })
  @ApiCreatedResponse({ type: RegisterEmailResponseDto })
  async registerEmail(@Body() dto: RegisterEmailDto) {
    return this.authService.registerCustomerEmail(dto);
  }

  @Post('register-phone')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Register customer with phone (OTP)' })
  @ApiOkResponse({ type: MessageResponseDto })
  async registerPhone(@Body() dto: RegisterPhoneDto, @Req() request: Request) {
    return this.authService.registerCustomerPhone(dto, this.requestMeta(request));
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify OTP for customer' })
  @ApiOkResponse({ type: AuthLoginResponseDto })
  async verifyOtp(
    @Body() dto: VerifyOtpDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.verifyCustomerOtp(dto, this.requestMeta(request));
    response.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('login-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer login (email/password)' })
  @ApiOkResponse({ type: AuthLoginResponseDto })
  async loginEmail(
    @Body() dto: LoginEmailDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.customerLoginEmail(dto, this.requestMeta(request));
    response.cookie(
      this.authService.getRefreshCookieName(),
      result.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return {
      accessToken: result.accessToken,
      user: result.user,
    };
  }

  @Post('resend-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Resend OTP to phone' })
  @ApiOkResponse({ type: MessageResponseDto })
  async resendOtp(@Body() dto: ResendOtpDto, @Req() request: Request) {
    return this.authService.resendCustomerOtp(dto, this.requestMeta(request));
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh customer access token' })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.authService.getRefreshCookieName()];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokens = await this.authService.customerRefresh(refreshToken);
    response.cookie(
      this.authService.getRefreshCookieName(),
      tokens.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Logout customer' })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.authService.getRefreshCookieName()];
    const result = await this.authService.customerLogout(
      refreshToken,
      this.requestMeta(request),
    );

    response.clearCookie(
      this.authService.getRefreshCookieName(),
      this.authService.getClearCookieOptions(),
    );
    return result;
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer forgot password' })
  @ApiOkResponse({ type: MessageResponseDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(
      Role.customer,
      dto,
      this.requestMeta(request),
    );
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Customer reset password' })
  @ApiOkResponse({ type: MessageResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(
      Role.customer,
      dto,
      this.requestMeta(request),
    );
  }

  private requestMeta(request: Request): { ipAddress: string; userAgent: string } {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress ?? 'unknown',
      userAgent: request.get('user-agent') ?? 'unknown',
    };
  }
}
