/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, ForbiddenException, Inject, forwardRef } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EventsGateway } from '../websocket/events.gateway';

@Injectable()
export class MessagesService {
  constructor(
    private prisma: PrismaService,
    @Inject(forwardRef(() => EventsGateway)) private eventsGateway: EventsGateway,
  ) {}

  async getConversations(userId: string) {
    const participants = await this.prisma.conversationParticipant.findMany({
      where: { userId, leftAt: null },
      include: {
        conversation: {
          include: { participants: true },
        },
      },
      orderBy: { conversation: { lastMessageAt: 'desc' } },
    });

    const userMap = await this.getParticipantUserMap(
      participants.flatMap((p) => p.conversation.participants.map((x) => x.userId)),
    );

    return participants.map((p) => {
      const conv = p.conversation;
      const other = conv.participants.find((x) => x.userId !== userId);
      const otherUser = other ? userMap.get(other.userId) : undefined;
      const isGroup = conv.type === 'GROUP';
      return {
        id: conv.id,
        type: conv.type,
        name: isGroup ? (conv.name || 'Group') : (otherUser?.displayName || otherUser?.username || 'Unknown'),
        avatar: otherUser?.avatar || conv.avatar || null,
        lastMessage: conv.lastMessage,
        lastMessageAt: conv.lastMessageAt,
        unreadCount: p.unreadCount,
        isPinned: p.isPinned,
        isMuted: p.isMuted,
        isArchived: conv.isArchived,
        participants: conv.participants.map((x) => ({ ...x, user: userMap.get(x.userId) || null })),
      };
    });
  }

  private async getParticipantUserMap(userIds: string[]) {
    const uniqueIds = [...new Set(userIds)];
    const users = await this.prisma.user.findMany({
      where: { id: { in: uniqueIds } },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatar: true,
        bio: true,
        location: true,
        website: true,
        role: true,
        isPrivate: true,
        lastActiveAt: true,
      },
    });
    return new Map(users.map((u) => [u.id, u]));
  }

  private async attachUsersToConversation(conversation: any) {
    const userMap = await this.getParticipantUserMap(conversation.participants.map((x: any) => x.userId));
    return {
      ...conversation,
      participants: conversation.participants.map((x: any) => ({ ...x, user: userMap.get(x.userId) || null })),
    };
  }

  async createConversation(userId: string, participantIds: string[], type = 'DIRECT', name?: string) {
    const allParticipantIds = [...new Set([userId, ...participantIds])];

    if (type === 'DIRECT' && allParticipantIds.length === 2) {
      const existing = await this.prisma.conversation.findFirst({
        where: {
          type: 'DIRECT',
          AND: allParticipantIds.map((id) => ({
            participants: { some: { userId: id } },
          })),
        },
      });
      if (existing) {
        const conv = await this.prisma.conversation.findUnique({
          where: { id: existing.id },
          include: { participants: true },
        });
        return this.attachUsersToConversation(conv);
      }
    }

    const created = await this.prisma.conversation.create({
      data: {
        type: type as any,
        name,
        participants: {
          create: allParticipantIds.map((id) => ({
            userId: id,
            role: id === userId ? 'OWNER' : 'MEMBER',
          })),
        },
      },
      include: { participants: true },
    });

    return this.attachUsersToConversation(created);
  }

  async sendMessage(conversationId: string, senderId: string, content: string, type = 'TEXT', media?: any, replyToId?: string) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId: senderId, leftAt: null },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    const message = await this.prisma.message.create({
      data: {
        conversationId,
        senderId,
        content,
        type: type as any,
        media: media ?? undefined,
        replyToId,
      },
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        replyTo: {
          include: {
            sender: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
        },
      },
    });

    const preview = this.messagePreview(message.content, message.type, message.media);
    await this.prisma.conversation.update({
      where: { id: conversationId },
      data: { lastMessageAt: new Date(), lastMessage: preview },
    });

    const participants = await this.prisma.conversationParticipant.findMany({
      where: { conversationId, userId: { not: senderId } },
      select: { userId: true },
    });

    for (const p of participants) {
      await this.prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId: p.userId } },
        data: { unreadCount: { increment: 1 } },
      });
      this.eventsGateway.sendToUser(p.userId, 'message:new', { conversationId, message });
    }

    return message;
  }

  private messagePreview(content: string, type: string, media?: any): string {
    if (content && content.trim()) return content.substring(0, 200);
    const labels: Record<string, string> = {
      IMAGE: '📷 Image',
      VIDEO: '🎬 Video',
      AUDIO: '🎵 Audio',
      VOICE_NOTE: '🎙️ Voice note',
      FILE: '📎 File',
      STICKER: 'Sticker',
      GIF: 'GIF',
      CODE: 'Code block',
    };
    if (labels[type]) return labels[type];
    if (Array.isArray(media) && media[0]?.url) return '📎 Attachment';
    return 'New message';
  }

  async getMessages(conversationId: string, userId: string, page = 1, limit = 50) {
    const participant = await this.prisma.conversationParticipant.findFirst({
      where: { conversationId, userId, leftAt: null },
    });
    if (!participant) throw new ForbiddenException('Not a participant');

    if (page <= 1) {
      await this.prisma.conversationParticipant.update({
        where: { conversationId_userId: { conversationId, userId } },
        data: { unreadCount: 0, lastReadAt: new Date() },
      });
    }

    const skip = (page - 1) * limit;
    return this.prisma.message.findMany({
      where: { conversationId, isDeleted: false },
      skip, take: limit,
      include: {
        sender: { select: { id: true, username: true, displayName: true, avatar: true } },
        replyTo: {
          include: {
            sender: { select: { id: true, username: true, displayName: true, avatar: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
