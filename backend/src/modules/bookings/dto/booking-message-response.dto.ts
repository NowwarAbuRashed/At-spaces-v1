import { ApiProperty } from '@nestjs/swagger';

export class BookingMessageResponseDto {
  @ApiProperty({ example: 'Booking cancelled' })
  message!: string;
}
