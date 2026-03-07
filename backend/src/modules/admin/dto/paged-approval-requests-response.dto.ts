import { ApiProperty } from '@nestjs/swagger';
import { ApprovalRequestItemDto } from './approval-request-item.dto';

export class PagedApprovalRequestsResponseDto {
  @ApiProperty({ type: ApprovalRequestItemDto, isArray: true })
  items!: ApprovalRequestItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 12 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}
