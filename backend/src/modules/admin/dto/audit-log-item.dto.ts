import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class AuditLogItemDto {
  @ApiProperty({ example: 9001 })
  id!: number;

  @ApiPropertyOptional({ example: 1, nullable: true })
  actorId!: number | null;

  @ApiProperty({ example: 'branch_status_updated' })
  action!: string;

  @ApiProperty({ example: 'branch' })
  entity!: string;

  @ApiPropertyOptional({ example: 12, nullable: true })
  entityId!: number | null;

  @ApiProperty({ type: 'object', additionalProperties: true })
  metadata!: Record<string, unknown>;

  @ApiProperty()
  timestamp!: Date;
}
