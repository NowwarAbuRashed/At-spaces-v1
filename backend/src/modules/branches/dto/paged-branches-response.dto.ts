import { ApiProperty } from '@nestjs/swagger';
import { BranchListItemDto } from './branch-list-item.dto';

export class PagedBranchesResponseDto {
  @ApiProperty({ type: BranchListItemDto, isArray: true })
  items!: BranchListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 42 })
  total!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}
