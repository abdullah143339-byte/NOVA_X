import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SearchService {
  constructor(private prisma: PrismaService) {}

  async globalSearch(query: string, userId?: string, page = 1, limit = 20) {
    const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 200);
    const skip = (page - 1) * limit;

    const [users, posts, communities] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          OR: [
            { username: { contains: sanitized } },
            { firstName: { contains: sanitized } },
            { lastName: { contains: sanitized } },
            { displayName: { contains: sanitized } },
            { bio: { contains: sanitized } },
          ],
          status: 'ACTIVE',
        },
        select: {
          id: true, username: true, firstName: true, lastName: true, avatar: true, bio: true,
          reputation: { select: { level: true, tier: true } },
        },
        take: limit,
      }),
      this.prisma.post.findMany({
        where: {
          OR: [
            { content: { contains: sanitized } },
            { title: { contains: sanitized } },
            { tags: { contains: sanitized } },
          ],
          visibility: 'PUBLIC',
          deletedAt: null,
        },
        select: {
          id: true, content: true, title: true, tags: true, reactionsCount: true, commentsCount: true,
          createdAt: true,
          author: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
        },
        orderBy: { trendingScore: 'desc' },
        take: limit,
      }),
      this.prisma.community.findMany({
        where: {
          OR: [
            { name: { contains: sanitized } },
            { description: { contains: sanitized } },
            { tags: { contains: sanitized } },
          ],
        },
        select: {
          id: true, name: true, description: true, avatar: true, category: true,
          _count: { select: { members: true } },
        },
        take: limit,
      }),
    ]);

    const results = [
      ...users.map((u) => ({ resultType: 'user' as const, ...u })),
      ...posts.map((p) => ({ resultType: 'post' as const, ...p })),
      ...communities.map((c) => ({ resultType: 'community' as const, ...c })),
    ];

    // Log search history if user is authenticated
    if (userId) {
      try {
        await this.prisma.searchHistory.create({
          data: { userId, query: sanitized, type: 'GLOBAL' },
        });
      } catch {}
    }

    return { results, total: results.length };
  }

  async getTrendingPosts(limit = 20) {
    return this.prisma.post.findMany({
      where: { visibility: 'PUBLIC', deletedAt: null },
      orderBy: { trendingScore: 'desc' },
      take: limit,
      include: {
        author: {
          select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }

  async getTrendingTags(limit = 20) {
    const posts = await this.prisma.post.findMany({
      where: { visibility: 'PUBLIC', deletedAt: null, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } },
      select: { tags: true },
    });

    const tagCount = new Map<string, number>();
    for (const post of posts) {
      try {
        const tags = JSON.parse(post.tags);
        if (Array.isArray(tags)) {
          for (const tag of tags) {
            tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
          }
        }
      } catch {}
    }

    return Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, limit)
      .map(([tag, count]) => ({ tag, count }));
  }

  async getSearchSuggestions(query: string) {
    const sanitized = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').slice(0, 50);

    const [users, tags] = await Promise.all([
      this.prisma.user.findMany({
        where: { OR: [{ username: { contains: sanitized } }, { displayName: { contains: sanitized } }] },
        select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
        take: 5,
      }),
      this.getTrendingTags(50).then((t) =>
        t.filter((t) => t.tag.toLowerCase().includes(sanitized.toLowerCase())).slice(0, 5)
      ),
    ]);

    return { users, tags };
  }
}
