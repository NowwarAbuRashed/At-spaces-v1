import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus, PaymentStatus } from '@prisma/client';

export class CreateBookingResponseDto {
  @ApiProperty({ example: 900 })
  bookingId!: number;

  @ApiProperty({ example: 'BKG-20260305-0001' })
  bookingNumber!: string;

  @ApiProperty({ example: 20 })
  totalPrice!: number;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.pending })
  status!: BookingStatus;

  @ApiProperty({ enum: PaymentStatus, example: PaymentStatus.pending })
  paymentStatus!: PaymentStatus;
}
