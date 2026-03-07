import { ApiProperty } from '@nestjs/swagger';
import { IsEnum } from 'class-validator';

export enum AdminVendorUpdateStatus {
  active = 'active',
  suspended = 'suspended',
}

export class UpdateVendorStatusDto {
  @ApiProperty({ enum: AdminVendorUpdateStatus })
  @IsEnum(AdminVendorUpdateStatus)
  status!: AdminVendorUpdateStatus;
}
