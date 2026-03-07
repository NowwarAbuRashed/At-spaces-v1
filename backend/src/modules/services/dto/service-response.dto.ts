import { ApiProperty } from '@nestjs/swagger';

export class ServiceResponseDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'Hot Desk' })
  name!: string;

  @ApiProperty({ example: 'seat' })
  unit!: string;
}
