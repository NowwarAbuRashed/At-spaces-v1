import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsInt,
  Matches,
  Min,
  ValidateNested,
} from 'class-validator';

export class AvailabilitySlotDto {
  @ApiProperty({ example: '10:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'start must be in HH:mm format',
  })
  start!: string;

  @ApiProperty({ example: '12:00' })
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, {
    message: 'end must be in HH:mm format',
  })
  end!: string;

  @ApiProperty({ example: 20, minimum: 0 })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  availableUnits!: number;
}

export class UpsertVendorAvailabilityDto {
  @ApiProperty({ example: 55 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  vendorServiceId!: number;

  @ApiProperty({ example: '2026-03-05' })
  @IsDateString()
  date!: string;

  @ApiProperty({ type: AvailabilitySlotDto, isArray: true })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AvailabilitySlotDto)
  slots!: AvailabilitySlotDto[];
}
