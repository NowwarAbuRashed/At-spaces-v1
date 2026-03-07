import { ApiProperty } from '@nestjs/swagger';
import { AdminVendorListItemDto } from './admin-vendor-list-item.dto';

export class PagedAdminVendorsResponseDto {
  @ApiProperty({ type: AdminVendorListItemDto, isArray: true })
  items!: AdminVendorListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 6 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}
