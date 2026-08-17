/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const STORY_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  async createStory(ownerId: string, media: string, mediaType = 'IMAGE', caption?: string) {
    const expiresAt = new Date(Date.now() + STORY_TTL_MS);
    const story = await this.prisma.story.create({
      data: { ownerId, media, mediaType: mediaType as any, caption: caption || null, expiresAt },
      include: { owner: { select: { id: true, username: true, displayName: true, avatar: true } } },
    });
    await this.prisma.user.update({ where: { id: ownerId }, data: { lastActiveAt: new Date() } });
    return story;
  }

  async getStoryFeed(userId: string, page = 1, limit = 30) {
    const now = new Date();
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    const [stories, total] = await Promise.all([
      this.prisma.story.findMany({
        where: {
          deletedAt: null,
          expiresAt: { gt: now },
          ownerId: { in: [...followingIds, userId] },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          owner: { select: { id: true, username: true, displayName: true, avatar: true } },
          views: { where: { viewerId: userId }, select: { id: true } },
        },
      }),
      this.prisma.story.count({
        where: {
          deletedAt: null,
          expiresAt: { gt: now },
          ownerId: { in: [...followingIds, userId] },
        },
      }),
    ]);

    const storiesByUser = new Map<string, any>();
    for (const story of stories) {
      const key = story.owner.id;
      const entry = storiesByUser.get(key);
      const viewed = story.views.length > 0;
      const item = {
        id: story.id,
        media: story.media,
        mediaType: story.mediaType,
        caption: story.caption,
        createdAt: story.createdAt,
        expiresAt: story.expiresAt,
        viewed,
      };
      if (entry) {
        entry.stories.push(item);
        if (!viewed) entry.hasUnviewed = true;
      } else {
        storiesByUser.set(key, {
          user: {
            id: story.owner.id,
            username: story.owner.username,
            displayName: story.owner.displayName,
            avatar: story.owner.avatar,
          },
          stories: [item],
          hasUnviewed: !viewed,
        });
      }
    }

    const users = Array.from(storiesByUser.values());
    return { users, total: users.length, page, totalPages: Math.ceil(total / limit) };
  }

  async getUserStories(ownerId: string, viewerId?: string) {
    const now = new Date();
    const owner = await this.prisma.user.findUnique({
      where: { id: ownerId },
      select: { id: true, username: true, displayName: true, avatar: true, isPrivate: true },
    });
    if (!owner) throw new NotFoundException('User not found');

    if (owner.isPrivate) {
      if (viewerId === ownerId) {
        // owner always sees their own
      } else if (viewerId) {
        const isFollowing = await this.prisma.follow.findUnique({
          where: { followerId_followingId: { followerId: viewerId, followingId: ownerId } },
        });
        if (!isFollowing) return { user: owner, stories: [] };
      } else {
        // Anonymous viewers cannot see private accounts' stories.
        return { user: owner, stories: [] };
      }
    }

    const stories = await this.prisma.story.findMany({
      where: { ownerId, deletedAt: null, expiresAt: { gt: now } },
      orderBy: { createdAt: 'desc' },
      include: {
        views: viewerId ? { where: { viewerId }, select: { id: true } } : { select: { id: true } },
      },
    });

    const enriched = stories.map((s) => ({
      id: s.id,
      media: s.media,
      mediaType: s.mediaType,
      caption: s.caption,
      createdAt: s.createdAt,
      expiresAt: s.expiresAt,
      viewed: s.views.length > 0,
    }));

    return { user: owner, stories: enriched };
  }

  async markStoryViewed(storyId: string, viewerId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.deletedAt || story.expiresAt < new Date()) {
      throw new NotFoundException('Story not found');
    }
    if (story.ownerId === viewerId) return { viewed: false };

    const existing = await this.prisma.storyView.findUnique({
      where: { storyId_viewerId: { storyId, viewerId } },
    });
    if (existing) return { viewed: true };

    await this.prisma.storyView.create({ data: { storyId, viewerId } });
    return { viewed: true };
  }

  async getStoryViews(storyId: string, requesterId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story || story.deletedAt) throw new NotFoundException('Story not found');
    if (story.ownerId !== requesterId) throw new ForbiddenException('Only the story owner can view the viewer list');

    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      orderBy: { viewedAt: 'desc' },
      include: {
        viewer: { select: { id: true, username: true, displayName: true, avatar: true } },
      },
    });
    return views.map((v) => ({ viewedAt: v.viewedAt, user: v.viewer }));
  }

  async deleteStory(storyId: string, userId: string) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } });
    if (!story) throw new NotFoundException('Story not found');
    if (story.ownerId !== userId) throw new ForbiddenException('Not authorized');
    await this.prisma.story.update({ where: { id: storyId }, data: { deletedAt: new Date() } });
    return { deleted: true };
  }
}