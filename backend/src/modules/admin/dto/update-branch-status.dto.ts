import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum AdminBranchUpdateStatus {
  active = 'active',
  suspended = 'suspended',
}

export class UpdateBranchStatusDto {
  @ApiProperty({ enum: AdminBranchUpdateStatus })
  @IsEnum(AdminBranchUpdateStatus)
  status!: AdminBranchUpdateStatus;
}
