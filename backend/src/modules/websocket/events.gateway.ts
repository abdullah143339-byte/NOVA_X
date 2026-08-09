/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../../prisma/prisma.service';

@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private onlineUsers = new Map<string, string>(); // userId -> socketId

  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      if (!token) {
        client.disconnect();
        return;
      }
      const payload = this.jwtService.verify(token as string);
      const userId = payload.sub;
      client.data.userId = userId;
      this.onlineUsers.set(userId, client.id);
      client.join(`user:${userId}`);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, firstName: true, lastName: true, username: true },
      });

      this.server.emit('user:online', { userId, user });
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      this.server.emit('user:offline', { userId });
    }
  }

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; content: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    const isParticipant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: data.conversationId, userId, leftAt: null },
    });
    if (!isParticipant) return;

    const message = await this.prisma.message.create({
      data: {
        conversationId: data.conversationId,
        senderId: userId,
        content: data.content,
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, username: true, avatar: true },
        },
      },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId: data.conversationId },
      select: { userId: true },
    });

    if (participants) {
      for (const participant of participants) {
        if (participant.userId !== userId) {
          this.server.to(`user:${participant.userId}`).emit('message:new', {
            conversationId: data.conversationId,
            message,
          });
        }
      }
    }

    return { event: 'message:sent', data: message };
  }

  @SubscribeMessage('message:typing')
  handleTyping(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string; isTyping: boolean },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    this.server
      .to(`conversation:${data.conversationId}`)
      .emit('message:typing', {
        conversationId: data.conversationId,
        userId,
        isTyping: data.isTyping,
      });
  }

  @SubscribeMessage('notification:read')
  async handleNotificationRead(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { notificationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;

    await this.prisma.notification.updateMany({
      where: { id: data.notificationId, userId },
      data: { isRead: true },
    });
  }

  @SubscribeMessage('conversation:join')
  async handleJoinConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    const userId = client.data.userId;
    if (!userId) return;
    const isParticipant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId: data.conversationId, userId, leftAt: null },
    });
    if (isParticipant) client.join(`conversation:${data.conversationId}`);
  }

  @SubscribeMessage('conversation:leave')
  handleLeaveConversation(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { conversationId: string },
  ) {
    client.leave(`conversation:${data.conversationId}`);
  }

  // Helper methods for services to emit events
  sendNotification(userId: string, notification: any) {
    this.server.to(`user:${userId}`).emit('notification:new', notification);
  }

  sendToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data);
  }

  isOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }
}
