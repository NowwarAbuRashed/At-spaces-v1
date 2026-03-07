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
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { Role } from '@prisma/client';
import { AuthService } from './auth.service';
import { AdminLoginDto } from './dto/admin-login.dto';
import { AdminMfaVerifyDto } from './dto/admin-mfa-verify.dto';
import { AdminResetPasswordDto } from './dto/admin-reset-password.dto';
import {
  AccessTokenResponseDto,
  AdminPreAuthResponseDto,
  AuthLoginResponseDto,
  MessageResponseDto,
} from './dto/auth-response.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';

@ApiTags('Auth - Admin')
@Controller('admin/auth')
export class AdminAuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login step 1 (password + captcha)' })
  @ApiOkResponse({ type: AdminPreAuthResponseDto })
  async login(@Body() dto: AdminLoginDto, @Req() request: Request) {
    return this.authService.adminLogin(dto, this.requestMeta(request));
  }

  @Post('mfa/verify')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin login step 2 (MFA verify)' })
  @ApiOkResponse({ type: AuthLoginResponseDto })
  async verifyMfa(
    @Body() dto: AdminMfaVerifyDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const result = await this.authService.adminMfaVerify(dto, this.requestMeta(request));

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
  @ApiOperation({ summary: 'Admin refresh access token' })
  @ApiOkResponse({ type: AccessTokenResponseDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.authService.getRefreshCookieName()];
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token missing');
    }

    const tokens = await this.authService.adminRefresh(refreshToken);
    response.cookie(
      this.authService.getRefreshCookieName(),
      tokens.refreshToken,
      this.authService.getRefreshCookieOptions(),
    );

    return { accessToken: tokens.accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin logout' })
  @ApiOkResponse({ type: MessageResponseDto })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const refreshToken = request.cookies?.[this.authService.getRefreshCookieName()];
    const result = await this.authService.adminLogout(
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
  @ApiOperation({ summary: 'Admin forgot password' })
  @ApiOkResponse({ type: MessageResponseDto })
  async forgotPassword(@Body() dto: ForgotPasswordDto, @Req() request: Request) {
    return this.authService.forgotPassword(Role.admin, dto, this.requestMeta(request));
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin reset password (requires TOTP)' })
  @ApiOkResponse({ type: MessageResponseDto })
  async resetPassword(@Body() dto: AdminResetPasswordDto, @Req() request: Request) {
    return this.authService.adminResetPassword(dto, this.requestMeta(request));
  }

  private requestMeta(request: Request): { ipAddress: string; userAgent: string } {
    return {
      ipAddress: request.ip ?? request.socket.remoteAddress ?? 'unknown',
      userAgent: request.get('user-agent') ?? 'unknown',
    };
  }
}
