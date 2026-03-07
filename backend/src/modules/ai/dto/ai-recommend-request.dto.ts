import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsDateString, IsInt, IsString, Min } from 'class-validator';

export class AiRecommendRequestDto {
  @ApiProperty({ example: 'quiet workspace near downtown' })
  @IsString()
  query!: string;

  @ApiProperty({ example: 'Amman' })
  @IsString()
  location!: string;

  @ApiProperty({ example: '2026-03-05T10:00:00Z' })
  @IsDateString()
  time!: string;

  @ApiProperty({ example: 120 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  durationMinutes!: number;
}
