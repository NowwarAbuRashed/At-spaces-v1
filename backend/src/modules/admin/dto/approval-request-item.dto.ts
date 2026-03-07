import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ApprovalRequestType, ApprovalStatus } from '@prisma/client';

export class ApprovalRequestItemDto {
  @ApiProperty({ example: 3001 })
  id!: number;

  @ApiProperty({ enum: ApprovalRequestType })
  type!: ApprovalRequestType;

  @ApiProperty({ enum: ApprovalStatus })
  status!: ApprovalStatus;

  @ApiPropertyOptional({ example: 12, nullable: true })
  branchId!: number | null;

  @ApiPropertyOptional({ example: 55, nullable: true })
  vendorServiceId!: number | null;

  @ApiPropertyOptional({ example: 8, nullable: true })
  requestedById!: number | null;

  @ApiPropertyOptional({ example: 1, nullable: true })
  reviewedById!: number | null;

  @ApiPropertyOptional({ nullable: true })
  reviewedAt!: Date | null;

  @ApiProperty()
  createdAt!: Date;
}
