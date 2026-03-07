import { ApiProperty } from '@nestjs/swagger';

export class BranchListItemDto {
  @ApiProperty({ example: 10 })
  id!: number;

  @ApiProperty({ example: 'Branch A' })
  name!: string;

  @ApiProperty({ example: 'Amman' })
  city!: string;

  @ApiProperty({ example: 'Abdali Boulevard' })
  address!: string;
}
