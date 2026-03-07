import { ApiProperty } from '@nestjs/swagger';
import { BookingListItemDto } from './booking-list-item.dto';

export class PagedBookingsResponseDto {
  @ApiProperty({ type: BookingListItemDto, isArray: true })
  items!: BookingListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 8 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}
