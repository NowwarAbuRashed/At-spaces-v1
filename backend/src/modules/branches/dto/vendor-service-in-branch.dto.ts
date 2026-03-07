import { ApiProperty } from '@nestjs/swagger';
import { API_PRICE_UNITS, ApiPriceUnit } from '../../../common/utils/api-price-unit.util';

export class VendorServiceInBranchDto {
  @ApiProperty({ example: 55 })
  vendorServiceId!: number;

  @ApiProperty({ example: 1 })
  serviceId!: number;

  @ApiProperty({ example: 'Hot Desk' })
  name!: string;

  @ApiProperty({ example: 5 })
  pricePerUnit!: number;

  @ApiProperty({ enum: API_PRICE_UNITS, example: 'hour' })
  priceUnit!: ApiPriceUnit;

  @ApiProperty({ example: 50 })
  maxCapacity!: number;

  @ApiProperty({ example: true })
  isAvailable!: boolean;
}
