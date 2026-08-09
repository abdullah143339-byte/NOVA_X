/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CommunitiesService {
  constructor(private prisma: PrismaService) {}

  async create(ownerId: string, data: { name: string; description?: string; type?: string; category?: string; tags?: string[] }) {
    if (!data.name || !data.name.trim()) {
      throw new BadRequestException('Community name is required');
    }
    const slug = data.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    return this.prisma.community.create({
      data: {
        name: data.name, slug, description: data.description,
        type: (data.type as any) || 'PUBLIC',
        category: data.category,         tags: JSON.stringify(data.tags || []),
        ownerId,
        membersCount: 1,
        members: { create: { userId: ownerId, role: 'OWNER' } },
      },
    });
  }

  async getAll(page = 1, limit = 20, category?: string) {
    const skip = (page - 1) * limit;
    const where = category ? { category, type: 'PUBLIC' as any } : { type: 'PUBLIC' as any };
    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        where, skip, take: limit,
        include: { _count: { select: { members: true } } },
        orderBy: { membersCount: 'desc' },
      }),
      this.prisma.community.count({ where }),
    ]);
    return { communities, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getBySlug(slug: string) {
    const community = await this.prisma.community.findUnique({
      where: { slug },
      include: {
        _count: { select: { members: true, channels: true } },
      },
    });
    if (!community) throw new NotFoundException('Community not found');
    return community;
  }

  async join(communityId: string, userId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');
    if (community.type === 'PRIVATE' || community.type === 'HIDDEN') {
      throw new ForbiddenException('This community is private');
    }
    const existing = await this.prisma.communityMember.findUnique({
      where: { communityId_userId: { communityId, userId } },
    });
    if (existing) throw new ConflictException('Already a member');
    await this.prisma.communityMember.create({ data: { communityId, userId } });
    await this.prisma.community.update({ where: { id: communityId }, data: { membersCount: { increment: 1 } } });
    return { joined: true };
  }

  async leave(communityId: string, userId: string) {
    const result = await this.prisma.communityMember.deleteMany({ where: { communityId, userId } });
    if (result.count > 0) {
      await this.prisma.community.update({
        where: { id: communityId },
        data: { membersCount: { decrement: 1 } },
      });
    }
    return { left: true };
  }
}
