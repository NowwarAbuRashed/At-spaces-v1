import { ApiProperty } from '@nestjs/swagger';

export class CreateCapacityRequestResponseDto {
  @ApiProperty({ example: 3001 })
  requestId!: number;

  @ApiProperty({ example: 'pending' })
  status!: string;
}
