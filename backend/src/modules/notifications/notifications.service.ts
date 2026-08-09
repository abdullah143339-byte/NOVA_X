/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable, Inject, forwardRef, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../websocket/events.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway)) private eventsGateway: EventsGateway,
  ) {}

  async getNotifications(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId }, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);
    return { notifications, total, unreadCount, page, totalPages: Math.ceil(total / limit) };
  }

  async createNotification(userId: string, data: { type: string; title: string; body: string; actorId?: string; data?: any }) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: data.type as any,
        title: data.title,
        body: data.body,
        actorId: data.actorId,
        data: data.data || {},
      },
    });
    this.eventsGateway.sendNotification(userId, notification);
    return notification;
  }

  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true, readAt: new Date() },
    });
    if (notification.count === 0) {
      throw new NotFoundException('Notification not found');
    }
    return { message: 'Notification marked as read' };
  }

  async markAllAsRead(userId: string) {
    await this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });
    return { message: 'All notifications marked as read' };
  }
}
