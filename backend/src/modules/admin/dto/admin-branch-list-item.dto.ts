import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BranchStatus } from '@prisma/client';

export class AdminBranchListItemDto {
  @ApiProperty({ example: 12 })
  id!: number;

  @ApiProperty({ example: 'Downtown Branch' })
  name!: string;

  @ApiProperty({ example: 'Amman' })
  city!: string;

  @ApiProperty({ example: 'Abdali Boulevard' })
  address!: string;

  @ApiProperty({ enum: BranchStatus })
  status!: BranchStatus;

  @ApiPropertyOptional({ example: 8, nullable: true })
  ownerId!: number | null;
}
