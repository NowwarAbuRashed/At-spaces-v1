import { ApiProperty } from '@nestjs/swagger';

export class FacilityCatalogItemDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'WiFi' })
  name!: string;

  @ApiProperty({ example: 'wifi', nullable: true, type: String })
  icon!: string | null;
}
