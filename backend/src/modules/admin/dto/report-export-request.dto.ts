import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsString } from 'class-validator';

export enum ReportFormat {
  csv = 'csv',
  pdf = 'pdf',
  xlsx = 'xlsx',
}

export class ReportExportRequestDto {
  @ApiProperty({ example: 'revenue' })
  @IsString()
  reportType!: string;

  @ApiProperty({ enum: ReportFormat, example: ReportFormat.csv })
  @IsEnum(ReportFormat)
  format!: ReportFormat;

  @ApiProperty({
    example: {
      from: '2026-03-01',
      to: '2026-03-05',
    },
    type: 'object',
    additionalProperties: true,
  })
  @IsObject()
  filters!: Record<string, unknown>;
}
