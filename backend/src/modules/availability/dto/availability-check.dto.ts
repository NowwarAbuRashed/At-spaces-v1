import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsISO8601, Min } from 'class-validator';
import { IsAfter } from '../../../common/validators/is-after.validator';

export class AvailabilityCheckDto {
  @ApiProperty({ example: 55 })
  @IsInt()
  @Min(1)
  vendorServiceId!: number;

  @ApiProperty({ example: '2026-03-05T10:00:00Z' })
  @IsISO8601()
  startTime!: string;

  @ApiProperty({ example: '2026-03-05T12:00:00Z' })
  @IsISO8601()
  @IsAfter('startTime', {
    message: 'endTime must be after startTime',
  })
  endTime!: string;

  @ApiProperty({ example: 2, minimum: 1 })
  @IsInt()
  @Min(1)
  quantity!: number;
}
