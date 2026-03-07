import { ApiProperty } from '@nestjs/swagger';
import { AdminBranchListItemDto } from './admin-branch-list-item.dto';

export class PagedAdminBranchesResponseDto {
  @ApiProperty({ type: AdminBranchListItemDto, isArray: true })
  items!: AdminBranchListItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 15 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}
