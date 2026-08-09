import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AuditService } from '../../common/services/audit.service';

const ADMIN_ROLES = ['USER', 'CREATOR', 'INSTRUCTOR', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN'];
const ORDER_STATUSES = ['PENDING', 'PAID', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED'];
const ITEM_STATUSES = ['DRAFT', 'ACTIVE', 'PAUSED', 'SOLD_OUT', 'REMOVED'];
const REPORT_RESOLUTION = ['RESOLVED', 'DISMISSED'];

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private audit: AuditService,
  ) {}

  // ===== USERS =====

  async getUsers(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          username: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          isSuspended: true,
          createdAt: true,
          _count: { select: { posts: true, followers: true, following: true } },
        },
      }),
      this.prisma.user.count(),
    ]);
    return { users, total, page, totalPages: Math.ceil(total / limit) };
  }

  async deleteUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (userId === adminId) throw new ForbiddenException('You cannot delete your own account');

    await this.prisma.$transaction([
      // Marketplace commerce
      this.prisma.purchase.deleteMany({ where: { buyerId: userId } }),
      this.prisma.review.deleteMany({ where: { buyerId: userId } }),
      this.prisma.orderItem.deleteMany({ where: { sellerId: userId } }),
      this.prisma.order.deleteMany({ where: { buyerId: userId } }),
      this.prisma.marketplaceItem.deleteMany({ where: { sellerId: userId } }),
      // Messages
      this.prisma.message.deleteMany({ where: { senderId: userId } }),
      this.prisma.conversationParticipant.deleteMany({ where: { userId } }),
      // Posts & engagement
      this.prisma.comment.deleteMany({ where: { authorId: userId } }),
      this.prisma.bookmark.deleteMany({ where: { userId } }),
      this.prisma.share.deleteMany({ where: { userId } }),
      this.prisma.reaction.deleteMany({ where: { userId } }),
      this.prisma.post.deleteMany({ where: { authorId: userId } }),
      this.prisma.follow.deleteMany({ where: { OR: [{ followerId: userId }, { followingId: userId }] } }),
      // Communities & learning
      this.prisma.communityMember.deleteMany({ where: { userId } }),
      this.prisma.courseEnrollment.deleteMany({ where: { userId } }),
      this.prisma.enrolledLearningPath.deleteMany({ where: { userId } }),
      this.prisma.learningProgress.deleteMany({ where: { userId } }),
      this.prisma.userAchievement.deleteMany({ where: { userId } }),
      // AI
      this.prisma.aIMessage.deleteMany({ where: { conversation: { userId } } }),
      this.prisma.aIConversation.deleteMany({ where: { userId } }),
      // Wallet
      this.prisma.transaction.deleteMany({ where: { wallet: { userId } } }),
      this.prisma.wallet.deleteMany({ where: { userId } }),
      this.prisma.reputation.deleteMany({ where: { userId } }),
      // Auth & profile
      this.prisma.notification.deleteMany({ where: { userId } }),
      this.prisma.notificationPreference.deleteMany({ where: { userId } }),
      this.prisma.session.deleteMany({ where: { userId } }),
      this.prisma.connectedAccount.deleteMany({ where: { userId } }),
      this.prisma.apiKey.deleteMany({ where: { userId } }),
      this.prisma.twoFactorAuth.deleteMany({ where: { userId } }),
      this.prisma.profile.deleteMany({ where: { userId } }),
      this.prisma.userSettings.deleteMany({ where: { userId } }),
      this.prisma.searchHistory.deleteMany({ where: { userId } }),
      this.prisma.securityEvent.deleteMany({ where: { userId } }),
      this.prisma.user.delete({ where: { id: userId } }),
    ]);

    await this.audit.log({ userId: adminId, action: 'DELETE_USER', resource: 'user', resourceId: userId });
    return { message: 'User deleted permanently' };
  }

  async banUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (userId === adminId) throw new ForbiddenException('You cannot ban your own account');
    if (user.role === 'SUPER_ADMIN') throw new ForbiddenException('Cannot ban a super admin');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'BANNED', isSuspended: true },
    });

    await this.audit.log({ userId: adminId, action: 'BAN_USER', resource: 'user', resourceId: userId });
    return { message: 'User banned' };
  }

  async unbanUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'ACTIVE', isSuspended: false },
    });

    await this.audit.log({ userId: adminId, action: 'UNBAN_USER', resource: 'user', resourceId: userId });
    return { message: 'User unbanned' };
  }

  async suspendUser(adminId: string, userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (userId === adminId) throw new ForbiddenException('You cannot suspend your own account');
    if (user.role === 'SUPER_ADMIN') throw new ForbiddenException('Cannot suspend a super admin');

    await this.prisma.user.update({
      where: { id: userId },
      data: { status: 'SUSPENDED', isSuspended: true },
    });

    await this.audit.log({ userId: adminId, action: 'SUSPEND_USER', resource: 'user', resourceId: userId });
    return { message: 'User suspended' };
  }

  async warnUser(adminId: string, userId: string, reason?: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    await this.prisma.notification.create({
      data: {
        userId,
        type: 'SYSTEM',
        title: 'Warning from moderators',
        body: reason || 'Your recent activity violated our community guidelines.',
      },
    });

    await this.audit.log({ userId: adminId, action: 'WARN_USER', resource: 'user', resourceId: userId });
    return { message: 'User warned' };
  }

  async updateUserRole(adminId: string, userId: string, role: string) {
    if (!ADMIN_ROLES.includes(role)) {
      throw new BadRequestException(`Invalid role. Allowed: ${ADMIN_ROLES.join(', ')}`);
    }
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');
    if (userId === adminId) throw new ForbiddenException('You cannot change your own role');

    await this.prisma.user.update({
      where: { id: userId },
      data: { role: role as any },
    });

    await this.audit.log({
      userId: adminId,
      action: 'UPDATE_USER_ROLE',
      resource: 'user',
      resourceId: userId,
      oldValues: { role: user.role },
      newValues: { role },
    });
    return { message: `Role updated to ${role}` };
  }

  // ===== ROLES =====

  async getRoles() {
    const groups = await this.prisma.user.groupBy({
      by: ['role'],
      _count: { _all: true },
    });
    const byRole = new Map(groups.map((g) => [g.role, g._count._all]));

    const users = await this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: { id: true, username: true, role: true, status: true, createdAt: true },
      take: 200,
    });

    const roles = ADMIN_ROLES.map((name) => {
      const members = users.filter((u) => u.role === name);
      return {
        name,
        count: byRole.get(name as any) ?? 0,
        members: members.slice(0, 8).map((m) => ({
          id: m.id,
          username: m.username,
          status: m.status,
          createdAt: m.createdAt,
        })),
      };
    });

    return { roles, total: users.length };
  }

  // ===== POSTS / CONTENT =====

  async getPosts(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, username: true, firstName: true, lastName: true } },
           _count: { select: { comments: true } },
        },
      }),
      this.prisma.post.count({ where: { deletedAt: null } }),
    ]);
    return { posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async deletePost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    await this.prisma.post.update({ where: { id: postId }, data: { deletedAt: new Date() } });

    await this.audit.log({ userId: adminId, action: 'DELETE_POST', resource: 'post', resourceId: postId });
    return { message: 'Post deleted' };
  }

  async publishPost(adminId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.deletedAt) throw new BadRequestException('Post is deleted');

    await this.prisma.post.update({
      where: { id: postId },
      data: { publishedAt: post.publishedAt ?? new Date(), visibility: 'PUBLIC' },
    });

    await this.audit.log({ userId: adminId, action: 'APPROVE_POST', resource: 'post', resourceId: postId });
    return { message: 'Post approved and published' };
  }

  async getReels(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null, type: 'VIDEO' as const, tags: { contains: 'reel' } };
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { viewCount: 'desc' },
        include: { author: { select: { id: true, username: true, firstName: true, lastName: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { reels: posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getStories(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const where = { deletedAt: null, tags: { contains: 'story' } };
    const [posts, total] = await Promise.all([
      this.prisma.post.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { author: { select: { id: true, username: true, firstName: true, lastName: true } } },
      }),
      this.prisma.post.count({ where }),
    ]);
    return { stories: posts, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getComments(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [comments, total] = await Promise.all([
      this.prisma.comment.findMany({
        where: { deletedAt: null },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: { select: { id: true, username: true, firstName: true, lastName: true } },
          post: { select: { id: true, content: true, type: true } },
        },
      }),
      this.prisma.comment.count({ where: { deletedAt: null } }),
    ]);
    return { comments, total, page, totalPages: Math.ceil(total / limit) };
  }

  async deleteComment(adminId: string, commentId: string) {
    const comment = await this.prisma.comment.findUnique({ where: { id: commentId } });
    if (!comment) throw new NotFoundException('Comment not found');

    await this.prisma.comment.update({ where: { id: commentId }, data: { deletedAt: new Date() } });

    await this.audit.log({ userId: adminId, action: 'DELETE_COMMENT', resource: 'comment', resourceId: commentId });
    return { message: 'Comment deleted' };
  }

  // ===== REPORTS =====

  async getReports(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [reports, total] = await Promise.all([
      this.prisma.report.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.report.count(),
    ]);

    const reporterIds = [...new Set(reports.map((r) => r.reporterId).filter(Boolean))];
    const users = reporterIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: reporterIds } },
          select: { id: true, username: true },
        })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    return {
      reports: reports.map((r) => ({ ...r, reporterUsername: userMap.get(r.reporterId) ?? null })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveReport(adminId: string, reportId: string, resolution?: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'RESOLVED', reviewedBy: adminId, reviewedAt: new Date(), resolution: resolution || 'Action taken' },
    });

    await this.audit.log({ userId: adminId, action: 'RESOLVE_REPORT', resource: 'report', resourceId: reportId });
    return { message: 'Report resolved' };
  }

  async dismissReport(adminId: string, reportId: string) {
    const report = await this.prisma.report.findUnique({ where: { id: reportId } });
    if (!report) throw new NotFoundException('Report not found');

    await this.prisma.report.update({
      where: { id: reportId },
      data: { status: 'DISMISSED', reviewedBy: adminId, reviewedAt: new Date() },
    });

    await this.audit.log({ userId: adminId, action: 'DISMISS_REPORT', resource: 'report', resourceId: reportId });
    return { message: 'Report dismissed' };
  }

  // ===== COMMUNITIES =====

  async getCommunities(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [communities, total] = await Promise.all([
      this.prisma.community.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: { select: { members: true } },
          members: { where: { role: 'OWNER' }, include: { user: { select: { id: true, username: true } } }, take: 1 },
        },
      }),
      this.prisma.community.count(),
    ]);
    return { communities, total, page, totalPages: Math.ceil(total / limit) };
  }

  async deleteCommunity(adminId: string, communityId: string) {
    const community = await this.prisma.community.findUnique({ where: { id: communityId } });
    if (!community) throw new NotFoundException('Community not found');

    await this.prisma.$transaction([
      this.prisma.communityMember.deleteMany({ where: { communityId } }),
      this.prisma.community.delete({ where: { id: communityId } }),
    ]);

    await this.audit.log({ userId: adminId, action: 'DELETE_COMMUNITY', resource: 'community', resourceId: communityId });
    return { message: 'Community deleted' };
  }

  // ===== MARKETPLACE =====

  async getMarketplaceItems(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          seller: { select: { id: true, username: true, firstName: true, lastName: true } },
          _count: { select: { purchases: true } },
        },
      }),
      this.prisma.marketplaceItem.count(),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateItemStatus(adminId: string, itemId: string, status: string) {
    if (!ITEM_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status. Allowed: ${ITEM_STATUSES.join(', ')}`);
    }
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Marketplace item not found');

    await this.prisma.marketplaceItem.update({ where: { id: itemId }, data: { status: status as any } });

    await this.audit.log({
      userId: adminId,
      action: 'UPDATE_ITEM_STATUS',
      resource: 'marketplace_item',
      resourceId: itemId,
      oldValues: { status: item.status },
      newValues: { status },
    });
    return { message: `Item status updated to ${status}` };
  }

  async toggleItemFeatured(adminId: string, itemId: string) {
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Marketplace item not found');

    await this.prisma.marketplaceItem.update({
      where: { id: itemId },
      data: { isFeatured: !item.isFeatured },
    });

    await this.audit.log({
      userId: adminId,
      action: 'TOGGLE_ITEM_FEATURED',
      resource: 'marketplace_item',
      resourceId: itemId,
      oldValues: { isFeatured: item.isFeatured },
      newValues: { isFeatured: !item.isFeatured },
    });
    return { message: item.isFeatured ? 'Item unfeatured' : 'Item featured' };
  }

  async getOrders(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          buyer: { select: { id: true, username: true, email: true } },
          items: {
            select: {
              id: true,
              quantity: true,
              priceAtPurchase: true,
              status: true,
              item: { select: { id: true, title: true, type: true } },
            },
          },
        },
      }),
      this.prisma.order.count(),
    ]);
    return { orders, total, page, totalPages: Math.ceil(total / limit) };
  }

  async updateOrderStatus(adminId: string, orderId: string, status: string) {
    if (!ORDER_STATUSES.includes(status)) {
      throw new BadRequestException(`Invalid status. Allowed: ${ORDER_STATUSES.join(', ')}`);
    }
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');

    await this.prisma.order.update({ where: { id: orderId }, data: { status: status as any } });

    await this.audit.log({
      userId: adminId,
      action: 'UPDATE_ORDER_STATUS',
      resource: 'order',
      resourceId: orderId,
      oldValues: { status: order.status },
      newValues: { status },
    });
    return { message: `Order status updated to ${status}` };
  }

  async getReviews(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [reviews, total] = await Promise.all([
      this.prisma.review.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          item: { select: { id: true, title: true, type: true } },
        },
      }),
      this.prisma.review.count(),
    ]);

    const buyerIds = [...new Set(reviews.map((r) => r.buyerId).filter(Boolean))];
    const buyers = buyerIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: buyerIds } }, select: { id: true, username: true } })
      : [];
    const buyerMap = new Map(buyers.map((u) => [u.id, u.username]));

    return {
      reviews: reviews.map((r) => ({ ...r, buyerUsername: buyerMap.get(r.buyerId) ?? null })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async deleteReview(adminId: string, reviewId: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) throw new NotFoundException('Review not found');

    await this.prisma.review.delete({ where: { id: reviewId } });

    await this.audit.log({ userId: adminId, action: 'DELETE_REVIEW', resource: 'review', resourceId: reviewId });
    return { message: 'Review deleted' };
  }

  // ===== MESSAGES (metadata) =====

  async getMessagesOverview(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [conversations, total, messageTotal, participantTotal] = await Promise.all([
      this.prisma.conversation.findMany({
        skip,
        take: limit,
        orderBy: { lastMessageAt: 'desc' },
        include: { _count: { select: { participants: true, messages: true } } },
      }),
      this.prisma.conversation.count(),
      this.prisma.message.count(),
      this.prisma.conversationParticipant.count(),
    ]);
    return {
      conversations,
      total,
      messageTotal,
      participantTotal,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  // ===== AI =====

  async getAiOverview() {
    const [totalConversations, totalMessages, tokenAgg, modelGroups] = await Promise.all([
      this.prisma.aIConversation.count(),
      this.prisma.aIMessage.count(),
      this.prisma.aIMessage.aggregate({
        _sum: { tokensUsed: true },
        _avg: { responseTime: true },
      }),
      this.prisma.aIMessage.groupBy({ by: ['model'], _count: true, where: { model: { not: null } } }),
    ]);
    return {
      totalConversations,
      totalMessages,
      totalTokens: tokenAgg._sum.tokensUsed ?? 0,
      avgResponseTime: Math.round(tokenAgg._avg.responseTime ?? 0),
      models: modelGroups.map((m) => ({ model: m.model, count: m._count })),
    };
  }

  // ===== ANALYTICS =====

  async getAnalyticsOverview(days = 30) {
    const since = new Date(Date.now() - days * 86400000);
    const [users, posts, comments, messages, orders, aiMessages, reactions, follows] = await Promise.all([
      this.prisma.user.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.post.findMany({ where: { createdAt: { gte: since }, deletedAt: null }, select: { createdAt: true, viewCount: true } }),
      this.prisma.comment.findMany({ where: { createdAt: { gte: since }, deletedAt: null }, select: { createdAt: true } }),
      this.prisma.message.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.order.findMany({
        where: { createdAt: { gte: since }, status: { not: 'CANCELLED' } },
        select: { createdAt: true, totalAmount: true, currency: true },
      }),
      this.prisma.aIMessage.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true, tokensUsed: true } }),
      this.prisma.reaction.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
      this.prisma.follow.findMany({ where: { createdAt: { gte: since } }, select: { createdAt: true } }),
    ]);

    const dayKey = (d: Date) => d.toISOString().slice(0, 10);
    const series = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      const key = dayKey(d);
      const dayOrders = orders.filter((o) => dayKey(o.createdAt) === key);
      const dayAi = aiMessages.filter((m) => dayKey(m.createdAt) === key);
      series.push({
        date: key,
        newUsers: users.filter((u) => dayKey(u.createdAt) === key).length,
        newPosts: posts.filter((p) => dayKey(p.createdAt) === key).length,
        newComments: comments.filter((c) => dayKey(c.createdAt) === key).length,
        newMessages: messages.filter((m) => dayKey(m.createdAt) === key).length,
        newOrders: dayOrders.length,
        revenue: dayOrders.reduce((s, o) => s + o.totalAmount, 0),
        aiMessages: dayAi.length,
        tokensUsed: dayAi.reduce((s, m) => s + (m.tokensUsed ?? 0), 0),
        reactions: reactions.filter((r) => dayKey(r.createdAt) === key).length,
        follows: follows.filter((f) => dayKey(f.createdAt) === key).length,
        views: posts.filter((p) => dayKey(p.createdAt) === key).reduce((s, p) => s + p.viewCount, 0),
      });
    }

    const totalRevenue = orders.reduce((s, o) => s + o.totalAmount, 0);
    const totalTokens = aiMessages.reduce((s, m) => s + (m.tokensUsed ?? 0), 0);

    return {
      series,
      totals: {
        newUsers: users.length,
        newPosts: posts.length,
        newComments: comments.length,
        newMessages: messages.length,
        newOrders: orders.length,
        revenue: totalRevenue,
        aiMessages: aiMessages.length,
        tokensUsed: totalTokens,
        reactions: reactions.length,
        follows: follows.length,
        views: posts.reduce((s, p) => s + p.viewCount, 0),
      },
      periodDays: days,
    };
  }

  // ===== FINANCIALS =====

  async getFinancials() {
    const [orderAgg, purchaseAgg, refundedOrders, recentOrders, topItems] = await Promise.all([
      this.prisma.order.aggregate({
        _sum: { totalAmount: true },
        _count: true,
        where: { status: { not: 'CANCELLED' } },
      }),
      this.prisma.purchase.aggregate({
        _sum: { amount: true },
        _count: true,
        where: { status: { not: 'FAILED' } },
      }),
      this.prisma.order.count({ where: { status: 'REFUNDED' } }),
      this.prisma.order.findMany({
        orderBy: { createdAt: 'desc' },
        take: 8,
        include: { buyer: { select: { id: true, username: true } } },
      }),
      this.prisma.marketplaceItem.findMany({
        orderBy: { salesCount: 'desc' },
        take: 8,
        select: { id: true, title: true, price: true, salesCount: true, rating: true },
      }),
    ]);

    return {
      revenue: orderAgg._sum.totalAmount ?? 0,
      orderCount: orderAgg._count,
      purchaseRevenue: purchaseAgg._sum.amount ?? 0,
      purchaseCount: purchaseAgg._count,
      refundedOrders,
      recentOrders,
      topItems,
    };
  }

  // ===== SECURITY =====

  async getSecurityEvents(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    const [events, total] = await Promise.all([
      this.prisma.securityEvent.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.securityEvent.count(),
    ]);

    const userIds = [...new Set(events.map((e) => e.userId).filter((id): id is string => !!id))];
    const users = userIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, username: true } })
      : [];
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    return {
      events: events.map((e) => ({ ...e, username: e.userId ? (userMap.get(e.userId) ?? null) : null })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async resolveSecurityEvent(adminId: string, eventId: string) {
    const event = await this.prisma.securityEvent.findUnique({ where: { id: eventId } });
    if (!event) throw new NotFoundException('Security event not found');

    await this.prisma.securityEvent.update({
      where: { id: eventId },
      data: { isResolved: true, resolvedAt: new Date() },
    });

    await this.audit.log({ userId: adminId, action: 'RESOLVE_SECURITY_EVENT', resource: 'security_event', resourceId: eventId });
    return { message: 'Security event resolved' };
  }

  // ===== NOTIFICATIONS =====

  async broadcastNotification(adminId: string, title: string, body?: string) {
    if (!title) throw new BadRequestException('Title is required');

    const userIds = await this.prisma.user.findMany({ select: { id: true } });
    if (userIds.length > 0) {
      await this.prisma.notification.createMany({
        data: userIds.map((u) => ({
          userId: u.id,
          type: 'SYSTEM' as const,
          title,
          body: body || '',
        })),
      });
    }

    await this.audit.log({ userId: adminId, action: 'BROADCAST_NOTIFICATION', resource: 'notification' });
    return { message: `Notification broadcast to ${userIds.length} users` };
  }

  // ===== STATS / HEALTH =====

  async getStats() {
    const [totalUsers, totalPosts, totalCommunities, totalProjects, totalOrders, totalMessages, totalAIMessages, totalItems, pendingReports, totalRevenue] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count({ where: { deletedAt: null } }),
      this.prisma.community.count(),
      this.prisma.post.count({ where: { deletedAt: null, tags: { contains: '"project"' } } }),
      this.prisma.order.count(),
      this.prisma.message.count(),
      this.prisma.aIMessage.count(),
      this.prisma.marketplaceItem.count(),
      this.prisma.report.count({ where: { status: 'PENDING' } }),
      this.prisma.order.aggregate({ _sum: { totalAmount: true }, where: { status: { not: 'CANCELLED' } } }),
    ]);

    return {
      totalUsers,
      totalPosts,
      totalCommunities,
      totalProjects,
      totalOrders,
      totalMessages,
      totalAIMessages,
      totalItems,
      pendingReports,
      totalRevenue: totalRevenue._sum.totalAmount ?? 0,
    };
  }

  async getHealth() {
    const [users, posts, communities, orders, aiMessages, messages, audits] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.community.count(),
      this.prisma.order.count(),
      this.prisma.aIMessage.count(),
      this.prisma.message.count(),
      this.prisma.auditLog.count(),
    ]);

    const mem = process.memoryUsage();

    return {
      status: 'OK',
      uptime: Math.round(process.uptime()),
      timestamp: new Date().toISOString(),
      memory: {
        rss: Math.round(mem.rss / 1024 / 1024),
        heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
        heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
      },
      database: {
        users,
        posts,
        communities,
        orders,
        aiMessages,
        messages,
        auditLogs: audits,
      },
    };
  }
}
