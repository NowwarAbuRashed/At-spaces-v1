import { ApiProperty } from '@nestjs/swagger';

export class AvailabilityCheckResponseDto {
  @ApiProperty({ example: true })
  available!: boolean;

  @ApiProperty({ example: 20 })
  price!: number;
}
