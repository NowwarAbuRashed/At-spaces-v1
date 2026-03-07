import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum VendorBookingStatusUpdate {
  completed = 'completed',
  no_show = 'no_show',
}

export class UpdateVendorBookingStatusDto {
  @ApiProperty({ enum: VendorBookingStatusUpdate, example: VendorBookingStatusUpdate.completed })
  @IsEnum(VendorBookingStatusUpdate)
  status!: VendorBookingStatusUpdate;
}
