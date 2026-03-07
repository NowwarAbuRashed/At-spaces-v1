import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class VendorBookingItemDto {
  @ApiProperty({ example: 900 })
  id!: number;

  @ApiProperty({ example: 'BKG-20260305-0001' })
  bookingNumber!: string;

  @ApiProperty({ example: 55 })
  vendorServiceId!: number;

  @ApiProperty({ example: 10 })
  branchId!: number;

  @ApiProperty({ example: 'Main Branch' })
  branchName!: string;

  @ApiProperty({ example: '2026-03-05T10:00:00.000Z' })
  startTime!: Date;

  @ApiProperty({ example: '2026-03-05T12:00:00.000Z' })
  endTime!: Date;

  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.pending })
  status!: BookingStatus;
}
