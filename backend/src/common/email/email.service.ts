import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Role } from '@prisma/client';
import { AppLogger } from '../logging/app-logger.service';

@Injectable()
export class EmailService {
  constructor(
    private readonly configService: ConfigService,
    private readonly logger: AppLogger,
  ) {}

  async sendPasswordResetEmail(
    role: Role,
    recipientEmail: string,
    resetToken: string,
  ): Promise<void> {
    if (!this.shouldSendEmails()) {
      return;
    }

    const subject = '[At Spaces] Password reset instructions';
    const body = [
      `Role: ${role}`,
      '',
      'Use this reset token to complete your password reset:',
      resetToken,
      '',
      'This token expires in 15 minutes and can only be used once.',
      'If you did not request this reset, please ignore this email.',
    ].join('\n');

    await this.sendEmail(recipientEmail, subject, body);
  }

  async sendAdminLockoutAlert(adminEmail: string, ipAddress: string): Promise<void> {
    if (!this.shouldSendEmails()) {
      return;
    }

    const subject = '[At Spaces][Security] Admin account lockout';
    const body = [
      'An admin account has been locked after repeated failed login attempts.',
      `Admin email: ${adminEmail}`,
      `IP address: ${ipAddress}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    await this.sendEmail(adminEmail, subject, body);

    const securityInbox = this.getSecurityInbox();
    if (securityInbox) {
      await this.sendEmail(securityInbox, subject, body);
    }
  }

  async sendAdminPasswordResetAlert(adminEmail: string, ipAddress: string): Promise<void> {
    if (!this.shouldSendEmails()) {
      return;
    }

    const subject = '[At Spaces][Security] Admin password reset completed';
    const body = [
      'An admin password reset has been completed.',
      `Admin email: ${adminEmail}`,
      `IP address: ${ipAddress}`,
      `Timestamp: ${new Date().toISOString()}`,
    ].join('\n');

    await this.sendEmail(adminEmail, subject, body);

    const securityInbox = this.getSecurityInbox();
    if (securityInbox) {
      await this.sendEmail(securityInbox, subject, body);
    }
  }

  private shouldSendEmails(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    return nodeEnv !== 'test';
  }

  private getSecurityInbox(): string | null {
    return (
      this.configService.get<string>('SES_SECURITY_TEAM_INBOX') ??
      this.configService.get<string>('AWS_SES_SECURITY_TEAM_INBOX') ??
      null
    );
  }

  private getFromEmail(): string | null {
    return (
      this.configService.get<string>('SES_FROM_EMAIL') ??
      this.configService.get<string>('AWS_SES_FROM_EMAIL') ??
      null
    );
  }

  private getSesRegion(): string | null {
    return this.configService.get<string>('AWS_REGION') ?? null;
  }

  private async sendEmail(
    toAddress: string,
    subject: string,
    textBody: string,
  ): Promise<void> {
    const region = this.getSesRegion();
    const fromEmail = this.getFromEmail();

    if (!region || !fromEmail) {
      this.logger.warn('email_send_skipped_missing_config', {
        toAddress,
        subject,
      });
      return;
    }

    const client = new SESClient({ region });
    try {
      await client.send(
        new SendEmailCommand({
          Source: fromEmail,
          Destination: {
            ToAddresses: [toAddress],
          },
          Message: {
            Subject: {
              Data: subject,
              Charset: 'UTF-8',
            },
            Body: {
              Text: {
                Data: textBody,
                Charset: 'UTF-8',
              },
            },
          },
        }),
      );
    } catch (error) {
      this.logger.error('email_send_failed', {
        toAddress,
        subject,
        error: error instanceof Error ? error.message : 'unknown_error',
      });
    }
  }
}
