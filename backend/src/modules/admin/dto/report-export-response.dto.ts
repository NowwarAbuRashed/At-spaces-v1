import { ApiProperty } from '@nestjs/swagger';

export class ReportExportResponseDto {
  @ApiProperty({ example: 'https://s3-presigned-url' })
  url!: string;

  @ApiProperty({ example: 300 })
  expiresIn!: number;
}
