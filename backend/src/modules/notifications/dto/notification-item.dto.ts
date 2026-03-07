import { ApiProperty } from '@nestjs/swagger';

export class NotificationItemDto {
  @ApiProperty({ example: 1 })
  id!: number;

  @ApiProperty({ example: 'booking' })
  type!: string;

  @ApiProperty({ example: 'Booking updated' })
  title!: string;

  @ApiProperty({ example: 'Your booking has been confirmed.' })
  body!: string;

  @ApiProperty({ example: false })
  isRead!: boolean;

  @ApiProperty({ example: '2026-03-05T10:30:00.000Z' })
  createdAt!: Date;
}
