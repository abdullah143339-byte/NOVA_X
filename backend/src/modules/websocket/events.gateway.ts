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

  // ------------------------------------------------------------------
  // WebRTC call signaling (relayed through the existing Socket.IO infra)
  // ------------------------------------------------------------------

  private activeCalls = new Map<string, string>(); // userId -> other userId
  private pendingOffers = new Map<string, any>(); // calleeId -> offer payload

  private async canCall(callerId: string, targetId: string): Promise<boolean> {
    if (callerId === targetId) return false;
    const [caller, target] = await Promise.all([
      this.prisma.user.findUnique({ where: { id: callerId }, select: { id: true } }),
      this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } }),
    ]);
    if (!caller || !target) return false;
    const block = await this.prisma.block.findFirst({
      where: {
        OR: [
          { blockerId: callerId, blockedId: targetId },
          { blockerId: targetId, blockedId: callerId },
        ],
      },
      select: { id: true },
    });
    return !block;
  }

  private async isInConversation(userId: string, targetId: string): Promise<boolean> {
    const conv = await this.prisma.conversation.findFirst({
      where: {
        type: 'DIRECT',
        AND: [
          { participants: { some: { userId, leftAt: null } } },
          { participants: { some: { userId: targetId, leftAt: null } } },
        ],
      },
      select: { id: true },
    });
    return !!conv;
  }

  @SubscribeMessage('call:offer')
  async handleCallOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; kind: 'voice' | 'video'; sdp?: any },
  ) {
    const callerId = client.data.userId;
    if (!callerId || !data?.toUserId) return;

    if (!(await this.canCall(callerId, data.toUserId))) {
      client.emit('call:error', { message: 'You cannot call this user' });
      return;
    }

    if (this.onlineUsers.has(data.toUserId)) {
      if (this.activeCalls.has(data.toUserId)) {
        client.emit('call:busy', { userId: data.toUserId });
        return;
      }
      const targetUser = await this.prisma.user.findUnique({
        where: { id: data.toUserId },
        select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
      });
      this.pendingOffers.set(data.toUserId, {
        fromUserId: callerId,
        kind: data.kind || 'voice',
        sdp: data.sdp,
      });
      this.server.to(`user:${data.toUserId}`).emit('call:incoming', {
        fromUserId: callerId,
        kind: data.kind || 'voice',
        conversationId: null,
        sdp: data.sdp,
        user: targetUser,
      });
    } else {
      client.emit('call:unavailable', { userId: data.toUserId });
    }
  }

  @SubscribeMessage('call:answer')
  async handleCallAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; sdp?: any },
  ) {
    const calleeId = client.data.userId;
    if (!calleeId || !data?.toUserId) return;
    if (!this.activeCalls.has(calleeId) || this.activeCalls.get(calleeId) !== data.toUserId) {
      this.activeCalls.set(calleeId, data.toUserId);
      this.activeCalls.set(data.toUserId, calleeId);
    }
    this.server.to(`user:${data.toUserId}`).emit('call:answer', { userId: calleeId, sdp: data.sdp });
  }

  @SubscribeMessage('call:ice')
  async handleCallIce(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string; candidate?: any },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.toUserId) return;
    this.server.to(`user:${data.toUserId}`).emit('call:ice', { userId, candidate: data.candidate });
  }

  @SubscribeMessage('call:reject')
  handleCallReject(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string },
  ) {
    const calleeId = client.data.userId;
    if (!calleeId || !data?.toUserId) return;
    this.pendingOffers.delete(calleeId);
    this.server.to(`user:${data.toUserId}`).emit('call:rejected', { userId: calleeId });
  }

  @SubscribeMessage('call:cancel')
  handleCallCancel(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string },
  ) {
    const callerId = client.data.userId;
    if (!callerId || !data?.toUserId) return;
    if (this.pendingOffers.get(data.toUserId)?.fromUserId === callerId) {
      this.pendingOffers.delete(data.toUserId);
    }
    this.server.to(`user:${data.toUserId}`).emit('call:cancelled', { userId: callerId });
  }

  @SubscribeMessage('call:end')
  handleCallEnd(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { toUserId: string },
  ) {
    const userId = client.data.userId;
    if (!userId || !data?.toUserId) return;
    this.endCallPair(userId, data.toUserId);
    this.server.to(`user:${data.toUserId}`).emit('call:ended', { userId });
  }

  private endCallPair(userId: string, otherId: string) {
    this.activeCalls.delete(userId);
    this.activeCalls.delete(otherId);
    this.pendingOffers.delete(userId);
    this.pendingOffers.delete(otherId);
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId;
    if (userId) {
      this.onlineUsers.delete(userId);
      const other = this.activeCalls.get(userId);
      if (other) {
        this.endCallPair(userId, other);
        this.server.to(`user:${other}`).emit('call:ended', { userId });
      }
      this.pendingOffers.delete(userId);
      this.server.emit('user:offline', { userId });
    }
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
