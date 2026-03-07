import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class AdminAnalyticsQueryDto {
  @ApiProperty({ example: '2026-03-01' })
  @IsDateString()
  from!: string;

  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  to!: string;
}
