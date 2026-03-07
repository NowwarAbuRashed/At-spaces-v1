import { ApiProperty } from '@nestjs/swagger';

export class FacilityPublicDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'WiFi' })
  name!: string;

  @ApiProperty({ example: 'wifi', nullable: true, type: String })
  icon!: string | null;

  @ApiProperty({ example: true })
  isAvailable!: boolean;

  @ApiProperty({ example: 'High-speed internet access', nullable: true, type: String })
  description!: string | null;
}
