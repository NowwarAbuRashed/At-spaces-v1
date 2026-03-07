import { BadRequestException, Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

const ALLOWED_MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export interface UploadedImageFile {
  mimetype: string;
  buffer: Buffer;
}

@Injectable()
export class UploadsService {
  constructor(private readonly configService: ConfigService) {}

  async uploadImage(file: UploadedImageFile): Promise<{ url: string; key: string }> {
    const extension = ALLOWED_MIME_TO_EXTENSION[file.mimetype];
    if (!extension) {
      throw new BadRequestException('Unsupported image type');
    }

    if (!file.buffer || file.buffer.length === 0) {
      throw new BadRequestException('Uploaded file is empty');
    }

    this.assertFileSignature(file.buffer, file.mimetype);

    const key = `uploads/${Date.now()}-${randomUUID()}.${extension}`;
    const baseUrl =
      this.configService.get<string>('UPLOAD_PUBLIC_BASE_URL') ?? 'https://uploads.local';

    if (this.isMockMode()) {
      return {
        url: `${baseUrl.replace(/\/+$/, '')}/${key}`,
        key,
      };
    }

    const region = this.configService.get<string>('AWS_REGION');
    if (!region) {
      throw new ServiceUnavailableException('Upload storage region is not configured');
    }

    const bucket =
      this.configService.get<string>('UPLOADS_S3_BUCKET') ??
      this.configService.get<string>('S3_BUCKET_PRIVATE_REPORTS') ??
      this.configService.get<string>('AWS_S3_BUCKET_PRIVATE_REPORTS');
    if (!bucket) {
      throw new ServiceUnavailableException('Upload bucket is not configured');
    }

    const s3 = new S3Client({ region });
    const sseMode =
      this.configService.get<string>('S3_SSE_MODE') ??
      this.configService.get<string>('AWS_S3_SSE_MODE') ??
      'SSE-S3';
    const kmsKeyId =
      this.configService.get<string>('S3_KMS_KEY_ID') ??
      this.configService.get<string>('AWS_S3_KMS_KEY_ID');

    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ...(sseMode === 'SSE-KMS'
          ? {
              ServerSideEncryption: 'aws:kms',
              ...(kmsKeyId ? { SSEKMSKeyId: kmsKeyId } : {}),
            }
          : { ServerSideEncryption: 'AES256' }),
      }),
    );

    const normalizedBaseUrl = baseUrl.replace(/\/+$/, '');
    return {
      url: `${normalizedBaseUrl}/${key}`,
      key,
    };
  }

  private isMockMode(): boolean {
    const nodeEnv = this.configService.get<string>('NODE_ENV') ?? 'development';
    return nodeEnv === 'test' || this.configService.get<string>('REPORT_EXPORT_MOCK') === 'true';
  }

  private assertFileSignature(buffer: Buffer, mimeType: string): void {
    const startsWith = (bytes: number[]): boolean =>
      bytes.every((byte, index) => buffer[index] === byte);

    if (mimeType === 'image/jpeg') {
      if (buffer.length < 3 || !startsWith([0xff, 0xd8, 0xff])) {
        throw new BadRequestException('Invalid JPEG file');
      }
      return;
    }

    if (mimeType === 'image/png') {
      if (
        buffer.length < 8 ||
        !startsWith([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
      ) {
        throw new BadRequestException('Invalid PNG file');
      }
      return;
    }

    if (mimeType === 'image/webp') {
      if (
        buffer.length < 12 ||
        buffer.subarray(0, 4).toString('ascii') !== 'RIFF' ||
        buffer.subarray(8, 12).toString('ascii') !== 'WEBP'
      ) {
        throw new BadRequestException('Invalid WEBP file');
      }
    }
  }
}
