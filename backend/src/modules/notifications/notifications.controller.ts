import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { JwtUser } from '../../common/interfaces/jwt-user.interface';
import { NotificationsQueryDto } from './dto/notifications-query.dto';
import { PagedNotificationsResponseDto } from './dto/paged-notifications-response.dto';
import { NotificationsService } from './notifications.service';

@ApiTags('Notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List notifications' })
  @ApiOkResponse({ type: PagedNotificationsResponseDto })
  async list(@CurrentUser() user: JwtUser, @Query() query: NotificationsQueryDto) {
    return this.notificationsService.listNotifications(user.sub, query);
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Mark notification as read' })
  @ApiOkResponse({
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Notification marked as read' },
      },
    },
  })
  async markRead(@CurrentUser() user: JwtUser, @Param('id', ParseIntPipe) id: number) {
    return this.notificationsService.markAsRead(user.sub, id);
  }
}
