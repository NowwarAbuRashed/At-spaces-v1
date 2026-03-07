import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { NotificationsQueryDto } from './dto/notifications-query.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async listNotifications(userId: number, query: NotificationsQueryDto) {
    const skip = (query.page - 1) * query.limit;
    const where = {
      userId,
    };

    const [items, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        skip,
        take: query.limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items: items.map((item) => ({
        id: item.id,
        type: item.type,
        title: item.title,
        body: item.body,
        isRead: Boolean(item.readAt),
        createdAt: item.createdAt,
      })),
      page: query.page,
      limit: query.limit,
      total,
      hasNext: skip + items.length < total,
    };
  }

  async markAsRead(userId: number, notificationId: number) {
    const notification = await this.prisma.notification.findUnique({
      where: {
        id: notificationId,
      },
      select: {
        id: true,
        userId: true,
      },
    });

    if (!notification || notification.userId !== userId) {
      throw new NotFoundException('Notification not found');
    }

    await this.prisma.notification.update({
      where: {
        id: notification.id,
      },
      data: {
        readAt: new Date(),
      },
    });

    return {
      message: 'Notification marked as read',
    };
  }
}
