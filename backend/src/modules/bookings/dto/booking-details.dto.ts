import { ApiProperty } from '@nestjs/swagger';
import { BookingListItemDto } from './booking-list-item.dto';

export class BookingDetailsDto extends BookingListItemDto {
  @ApiProperty({ example: 2 })
  quantity!: number;

  @ApiProperty({ example: 20 })
  totalPrice!: number;

  @ApiProperty({ example: 55 })
  vendorServiceId!: number;
}
