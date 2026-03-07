import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class AdminVendorListItemDto {
  @ApiProperty({ example: 8 })
  id!: number;

  @ApiProperty({ example: 'Vendor Name' })
  fullName!: string;

  @ApiProperty({ example: 'vendor@example.com', nullable: true })
  email!: string | null;

  @ApiProperty({ enum: UserStatus })
  status!: UserStatus;
}
