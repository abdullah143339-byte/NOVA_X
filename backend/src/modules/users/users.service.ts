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

  async getByUsername(username: string) {
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
    return user;
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
