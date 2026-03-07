import { ApiProperty } from '@nestjs/swagger';
import { NotificationItemDto } from './notification-item.dto';

export class PagedNotificationsResponseDto {
  @ApiProperty({ type: NotificationItemDto, isArray: true })
  items!: NotificationItemDto[];

  @ApiProperty({ example: 1 })
  page!: number;

  @ApiProperty({ example: 20 })
  limit!: number;

  @ApiProperty({ example: 50 })
  total!: number;

  @ApiProperty({ example: true })
  hasNext!: boolean;
}
