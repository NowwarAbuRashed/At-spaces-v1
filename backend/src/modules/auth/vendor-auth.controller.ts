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
import { ApiAcceptedResponse, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { LoginEmailDto } from './dto/login-email.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VendorRegisterDto } from './dto/vendor-register.dto';
import {
  AccessTokenResponseDto,
  AuthLoginResponseDto,
  MessageResponseDto,
} from './dto/auth-response.dto';

@ApiTags('Vendors')
@Controller('vendors')
export class VendorRegistrationController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.ACCEPTED)
  @ApiOperation({ summary: 'Vendor registration (requires admin approval)' })
  @ApiAcceptedResponse({ type: MessageResponseDto })
  async register(@Body() dto: VendorRegisterDto) {
    return this.authService.vendorRegister(dto);
  }
}

@ApiTags('Auth - Vendor')
@Controller('auth/vendor')
export class VendorAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor login' })
  @ApiOkResponse({ type: AuthLoginResponseDto })
  async login(
    @Body() dto: LoginEmailDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.vendorLogin(dto, this.requestMeta(request));
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

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor refresh access token' })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.authService.getRefreshCookieName()];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokens = await this.authService.vendorRefresh(refreshToken);
    response.cookie(
      this.authService.getRefreshCookieName(),
      tokens.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor logout' })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.authService.getRefreshCookieName()];
    const result = await this.authService.vendorLogout(
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
  @ApiOperation({ summary: 'Vendor forgot password' })
  @ApiOkResponse({ type: MessageResponseDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(Role.vendor, dto, this.requestMeta(request));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Vendor reset password' })
  @ApiOkResponse({ type: MessageResponseDto })
  async resetPassword(@Body() dto: ResetPasswordDto, @Req() request: Request) {
    return this.authService.resetPassword(Role.vendor, dto, this.requestMeta(request));
  }

  private requestMeta(request: Request): { ipAddress: string; userAgent: string } {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress ?? 'unknown',
      userAgent: request.get('user-agent') ?? 'unknown',
    };
  }
}
