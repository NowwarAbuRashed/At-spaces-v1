import { ApiProperty } from '@nestjs/swagger';

export class ReportExportResponseDto {
  @ApiProperty({
    enum: ['ready', 'unavailable'],
    example: 'ready',
    description: 'Report export availability state for this request',
  })
  status!: 'ready' | 'unavailable';

  @ApiProperty({
    example: 'https://s3-presigned-url',
    required: false,
    nullable: true,
  })
  url?: string | null;

  @ApiProperty({
    example: 300,
    required: false,
    nullable: true,
  })
  expiresIn?: number | null;

  @ApiProperty({
    example: 'Report export is unavailable in this environment.',
    required: false,
    nullable: true,
  })
  message?: string | null;
}
