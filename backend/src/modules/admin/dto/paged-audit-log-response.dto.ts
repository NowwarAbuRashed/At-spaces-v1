import { ApiProperty } from '@nestjs/swagger';
import { AuditLogItemDto } from './audit-log-item.dto';

export class PagedAuditLogResponseDto {
  @ApiProperty({ type: AuditLogItemDto, isArray: true })
  items!: AuditLogItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 50 })
  limit!: number;

  @ApiProperty({ example: 120 })
  total!: number;

  @ApiProperty({ example: false })
  hasNext!: boolean;
}
