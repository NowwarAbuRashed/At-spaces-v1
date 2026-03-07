import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface HcaptchaResponse {
  success: boolean;
}

@Injectable()
export class CaptchaService {
  constructor(private readonly configService: ConfigService) {}

  async verifyToken(token: string, remoteIp: string): Promise<boolean> {
    const bypass =
      process.env.HCAPTCHA_TEST_BYPASS ??
      this.configService.get<string>('HCAPTCHA_TEST_BYPASS');
    if (bypass === 'true') {
      return token === 'test-pass';
    }

    const secret =
      process.env.HCAPTCHA_SECRET ??
      this.configService.get<string>('HCAPTCHA_SECRET');
    if (!secret) {
      return false;
    }

    const body = new URLSearchParams({
      secret,
      response: token,
      remoteip: remoteIp,
    });

    const response = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    });

    if (!response.ok) {
      return false;
    }

    const data = (await response.json()) as HcaptchaResponse;
    return Boolean(data.success);
  }
}
