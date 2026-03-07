import { ApiProperty } from '@nestjs/swagger';
import { VendorBookingItemDto } from './vendor-booking-item.dto';

export class PagedVendorBookingsResponseDto {
  @ApiProperty({ type: VendorBookingItemDto, isArray: true })
  items!: VendorBookingItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 50 })
  limit!: number;

  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}
