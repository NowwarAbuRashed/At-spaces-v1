import { ApiProperty } from '@nestjs/swagger';

export class FeatureCatalogItemDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Whiteboard' })
  name!: string;

  @ApiProperty({ example: null, nullable: true, type: String })
  icon!: string | null;
}
