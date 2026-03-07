import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';
import { AvailabilityCheckDto } from '../../availability/dto/availability-check.dto';

export enum BookingPaymentMethod {
  cash = 'cash',
  card = 'card',
  apple_pay = 'apple_pay',
}

export class CreateBookingDto extends AvailabilityCheckDto {
  @ApiProperty({ enum: BookingPaymentMethod, example: BookingPaymentMethod.cash })
  @IsEnum(BookingPaymentMethod)
  paymentMethod!: BookingPaymentMethod;
}
