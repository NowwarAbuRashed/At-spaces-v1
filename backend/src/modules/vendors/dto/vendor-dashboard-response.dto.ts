import { ApiProperty } from '@nestjs/swagger';

export enum VendorBranchStatus {
  calm = 'calm',
  moderate = 'moderate',
  busy = 'busy',
}

export class VendorDashboardResponseDto {
  @ApiProperty({ example: 65 })
  todayOccupancy!: number;

  @ApiProperty({ example: 4 })
  upcomingBookings!: number;

  @ApiProperty({ enum: VendorBranchStatus, example: VendorBranchStatus.moderate })
  branchStatus!: VendorBranchStatus;
}
