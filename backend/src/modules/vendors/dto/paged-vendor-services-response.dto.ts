import { ApiProperty } from '@nestjs/swagger';
import { VendorServiceResponseDto } from './vendor-service-response.dto';

export class PagedVendorServicesResponseDto {
  @ApiProperty({ type: VendorServiceResponseDto, isArray: true })
  items!: VendorServiceResponseDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 8 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}
