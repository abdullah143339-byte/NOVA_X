/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true, username: true, displayName: true, avatar: true, coverImage: true,
        bio: true, location: true, website: true, isEmailVerified: true, createdAt: true,
        profile: true, reputation: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async getByUsername(username: string, viewerId?: string) {
    const user = await this.prisma.user.findUnique({
      where: { username: username.toLowerCase() },
      select: {
        id: true, username: true, displayName: true, avatar: true, coverImage: true,
        bio: true, location: true, website: true, createdAt: true,
        profile: true,
        _count: { select: { followers: true, following: true, posts: true } },
      },
    });
    if (!user) throw new NotFoundException('User not found');
    let isFollowing = false;
    if (viewerId && viewerId !== user.id) {
      const rel = await this.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: viewerId, followingId: user.id } },
        select: { id: true },
      });
      isFollowing = !!rel;
    }
    return { ...user, isFollowing };
  }

  async updateProfile(userId: string, data: any) {
    const allowed = ['displayName', 'bio', 'location', 'website', 'avatar', 'coverImage'];
    const updateData: any = {};
    for (const key of allowed) {
      if (data[key] !== undefined) updateData[key] = data[key];
    }
    return this.prisma.user.update({ where: { id: userId }, data: updateData });
  }

  async follow(followerId: string, followingId: string) {
    if (followerId === followingId) throw new ConflictException('Cannot follow yourself');
    const existing = await this.prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
    if (existing) {
      await this.prisma.follow.delete({ where: { id: existing.id } });
      await this.prisma.$transaction([
        this.prisma.profile.updateMany({ where: { userId: followerId }, data: { followingCount: { decrement: 1 } } }),
        this.prisma.profile.updateMany({ where: { userId: followingId }, data: { followersCount: { decrement: 1 } } }),
      ]);
      return { following: false };
    }
    await this.prisma.follow.create({ data: { followerId, followingId } });
    await this.prisma.$transaction([
      this.prisma.profile.updateMany({ where: { userId: followerId }, data: { followingCount: { increment: 1 } } }),
      this.prisma.profile.updateMany({ where: { userId: followingId }, data: { followersCount: { increment: 1 } } }),
    ]);

    const follower = await this.prisma.user.findUnique({ where: { id: followerId } });
    await this.notificationsService.createNotification(followingId, {
      type: 'FOLLOW',
      title: 'New Follower',
      body: `${follower?.displayName || follower?.username} started following you.`,
      actorId: followerId,
      data: { followerId },
    });

    return { following: true };
  }

  async getFollowers(username: string, viewerId: string | undefined, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    const skip = (page - 1) * limit;
    const where = { followingId: user.id, status: 'ACTIVE' as any };
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { followerId: true },
      }),
      this.prisma.follow.count({ where }),
    ]);
    const followerIds = follows.map((f) => f.followerId);
    const followers = followerIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: followerIds } },
          select: {
            id: true, username: true, displayName: true, avatar: true, bio: true,
            _count: { select: { followers: true } },
          },
        })
      : [];
    const ordered = followerIds
      .map((id) => followers.find((u) => u.id === id))
      .filter(Boolean) as any[];
    return this.withRelationships(ordered, viewerId, followerIds, page, total, limit);
  }

  async getFollowing(username: string, viewerId: string | undefined, page = 1, limit = 20) {
    const user = await this.prisma.user.findUnique({ where: { username: username.toLowerCase() }, select: { id: true } });
    if (!user) throw new NotFoundException('User not found');
    const skip = (page - 1) * limit;
    const where = { followerId: user.id, status: 'ACTIVE' as any };
    const [follows, total] = await Promise.all([
      this.prisma.follow.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: { followingId: true },
      }),
      this.prisma.follow.count({ where }),
    ]);
    const followingIds = follows.map((f) => f.followingId);
    const users = followingIds.length > 0
      ? await this.prisma.user.findMany({
          where: { id: { in: followingIds } },
          select: {
            id: true, username: true, displayName: true, avatar: true, bio: true,
            _count: { select: { followers: true } },
          },
        })
      : [];
    const ordered = followingIds
      .map((id) => users.find((u) => u.id === id))
      .filter(Boolean) as any[];
    return this.withRelationships(ordered, viewerId, followingIds, page, total, limit);
  }

  private async withRelationships(
    users: { id: string; username: string; displayName: string | null; avatar: string | null; bio: string | null; _count: { followers: number } }[],
    viewerId: string | undefined,
    userIds: string[],
    page: number,
    total: number,
    limit: number,
  ) {
    let isFollowingSet = new Set<string>();
    let followsYouSet = new Set<string>();
    if (viewerId) {
      const [isFollowing, followsYou] = userIds.length > 0 ? await Promise.all([
        this.prisma.follow.findMany({ where: { followerId: viewerId, followingId: { in: userIds } }, select: { followingId: true } }),
        this.prisma.follow.findMany({ where: { followerId: { in: userIds }, followingId: viewerId }, select: { followerId: true } }),
      ]) : [[], []];
      isFollowingSet = new Set(isFollowing.map((f) => f.followingId));
      followsYouSet = new Set(followsYou.map((f) => f.followerId));
    }
    const list = users.map((u) => ({
      id: u.id,
      username: u.username,
      displayName: u.displayName,
      avatar: u.avatar,
      bio: u.bio,
      followersCount: u._count.followers,
      isFollowing: viewerId ? isFollowingSet.has(u.id) : false,
      followsYou: viewerId ? followsYouSet.has(u.id) : false,
    }));
    return { users: list, total, page, totalPages: Math.ceil(total / limit) };
  }

  async blockUser(blockerId: string, blockedId: string, reason?: string) {
    if (blockerId === blockedId) throw new ConflictException('Cannot block yourself');
    const target = await this.prisma.user.findUnique({ where: { id: blockedId }, select: { id: true } });
    if (!target) throw new NotFoundException('User not found');

    const existing = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
    });
    if (existing) return { blocked: true, already: true };

    await this.prisma.block.create({ data: { blockerId, blockedId, reason: reason || null } });

    // Clean up the follow relationship both ways when blocking.
    await this.prisma.follow.deleteMany({
      where: { OR: [
        { followerId: blockerId, followingId: blockedId },
        { followerId: blockedId, followingId: blockerId },
      ] },
    });
    await this.prisma.$transaction([
      this.prisma.profile.updateMany({ where: { userId: blockerId }, data: { followingCount: { decrement: 1 } } }),
      this.prisma.profile.updateMany({ where: { userId: blockedId }, data: { followersCount: { decrement: 1 } } }),
    ]);

    return { blocked: true };
  }

  async unblockUser(blockerId: string, blockedId: string) {
    const deleted = await this.prisma.block.deleteMany({
      where: { blockerId, blockedId },
    });
    return { unblocked: deleted.count > 0 };
  }

  async getBlockStatus(blockerId: string, blockedId: string) {
    const blocked = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId } },
      select: { id: true },
    });
    const blockedBy = await this.prisma.block.findUnique({
      where: { blockerId_blockedId: { blockerId: blockedId, blockedId: blockerId } },
      select: { id: true },
    });
    return {
      blocked: !!blocked,
      blockedBy: !!blockedBy,
    };
  }

  async getBlockedUsers(blockerId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [blocks, total] = await Promise.all([
      this.prisma.block.findMany({
        where: { blockerId },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          blocked: { select: { id: true, username: true, displayName: true, avatar: true, bio: true } },
        },
      }),
      this.prisma.block.count({ where: { blockerId } }),
    ]);
    return {
      users: blocks.map((b) => b.blocked),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async reportUser(reporterId: string, targetId: string, reason: string, description?: string) {
    if (reporterId === targetId) throw new ConflictException('Cannot report yourself');
    const target = await this.prisma.user.findUnique({ where: { id: targetId }, select: { id: true } });
    if (!target) throw new NotFoundException('User not found');

    const reasonValue = (reason || 'OTHER').toUpperCase().replace(/[ -]/g, '_');
    const valid = ['SPAM', 'HARASSMENT', 'HATE_SPEECH', 'VIOLENCE', 'MISINFORMATION', 'COPYRIGHT', 'SELF_HARM', 'NUDITY', 'SCAM', 'OTHER'];
    const normalized = valid.includes(reasonValue) ? reasonValue : 'OTHER';

    return this.prisma.report.create({
      data: {
        reporterId,
        targetType: 'USER',
        targetId,
        reason: normalized as any,
        description: description || null,
      },
    });
  }

  async getRecommended(userId: string, limit = 6) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        following: { select: { followingId: true }, take: 500 },
        followers: { select: { followerId: true }, take: 500 },
      },
    });
    if (!me) throw new NotFoundException('User not found');

    const myFollowing = new Set(me.following.map((f) => f.followingId));
    const myFollowers = new Set(me.followers.map((f) => f.followerId));

    const candidates = await this.prisma.user.findMany({
      where: { id: { not: userId }, status: 'ACTIVE' },
      select: {
        id: true, username: true, displayName: true, avatar: true, bio: true,
        profile: { select: { headline: true } },
        _count: { select: { followers: true } },
      },
      orderBy: { followers: { _count: 'desc' } },
      take: 20,
    });

    const ranked = await Promise.all(candidates.map(async (u) => {
      const following = await this.prisma.follow.findMany({
        where: { followerId: u.id, followingId: { in: [...myFollowing] } },
        select: { followingId: true },
      });
      return {
        id: u.id,
        username: u.username,
        displayName: u.displayName,
        avatar: u.avatar,
        bio: u.bio,
        headline: u.profile?.headline || null,
        followersCount: u._count.followers,
        isFollowing: myFollowing.has(u.id),
        followsYou: myFollowers.has(u.id),
        mutualCount: following.length,
      };
    }));

    ranked.sort((a, b) => b.mutualCount - a.mutualCount || b.followersCount - a.followersCount);
    return ranked.slice(0, limit);
  }

  async search(query: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const where = {
      OR: [
        { username: { contains: query } },
        { displayName: { contains: query } },
      ],
      status: 'ACTIVE' as any,
    };
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where, skip, take: limit,
        select: { id: true, username: true, displayName: true, avatar: true, bio: true },
        orderBy: { username: 'asc' },
      }),
      this.prisma.user.count({ where }),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }
}
