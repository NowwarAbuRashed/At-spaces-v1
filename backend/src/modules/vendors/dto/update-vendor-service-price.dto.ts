import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsNumber, Min } from 'class-validator';
import { API_PRICE_UNITS, ApiPriceUnit } from '../../../common/utils/api-price-unit.util';

export class UpdateVendorServicePriceDto {
  @ApiProperty({ example: 25.0, minimum: 0.01 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  pricePerUnit!: number;

  @ApiProperty({ enum: API_PRICE_UNITS, example: 'day' })
  @IsIn(API_PRICE_UNITS)
  priceUnit!: ApiPriceUnit;
}
