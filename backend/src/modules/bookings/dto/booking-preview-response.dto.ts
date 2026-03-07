import { ApiProperty } from '@nestjs/swagger';

export class BookingPreviewResponseDto {
  @ApiProperty({ example: 20 })
  totalPrice!: number;

  @ApiProperty({ example: 'JOD' })
  currency!: string;
}
