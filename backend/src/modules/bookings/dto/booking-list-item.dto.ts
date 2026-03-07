import { ApiProperty } from '@nestjs/swagger';
import { BookingStatus } from '@prisma/client';

export class BookingListItemDto {
  @ApiProperty({ example: 901 })
  id!: number;

  @ApiProperty({ example: 'BKG-20260305-0001' })
  bookingNumber!: string;

  @ApiProperty({ example: 'Branch A' })
  branchName!: string;

  @ApiProperty({ example: '2026-03-05T10:00:00.000Z' })
  startTime!: Date;

  @ApiProperty({ example: '2026-03-05T12:00:00.000Z' })
  endTime!: Date;

  @ApiProperty({ enum: BookingStatus, example: BookingStatus.pending })
  status!: BookingStatus;
}
