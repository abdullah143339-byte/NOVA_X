import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReputationService {
  constructor(private prisma: PrismaService) {}

  private readonly SCORE_WEIGHTS: Record<string, { activity?: number; contribution?: number; trust?: number; expertise?: number }> = {
    POST_CREATED: { activity: 5, contribution: 3 },
    POST_LIKED: { activity: 1, contribution: 2 },
    POST_SHARED: { activity: 1, contribution: 3 },
    COMMENT_CREATED: { activity: 3, contribution: 2 },
    COMMENT_LIKED: { activity: 1, contribution: 1 },
    FOLLOW_RECEIVED: { trust: 5, expertise: 2 },
    COMMUNITY_JOINED: { contribution: 3 },
    COURSE_COMPLETED: { expertise: 15, contribution: 5 },
    CHALLENGE_COMPLETED: { expertise: 20, contribution: 10 },
    BADGE_EARNED: { expertise: 10, trust: 5 },
    DAILY_LOGIN: { activity: 2 },
    WEEK_STREAK: { activity: 10, trust: 5 },
    PURCHASE_MADE: { contribution: 5 },
    CONTENT_REPORTED: { trust: -10 },
  };

  private readonly TIER_THRESHOLDS = [
    { tier: 'BRONZE', min: 0 },
    { tier: 'SILVER', min: 100 },
    { tier: 'GOLD', min: 500 },
    { tier: 'PLATINUM', min: 2000 },
    { tier: 'DIAMOND', min: 5000 },
    { tier: 'LEGENDARY', min: 15000 },
  ];

  async addScore(userId: string, event: string, multiplier = 1) {
    const weights = this.SCORE_WEIGHTS[event as keyof typeof this.SCORE_WEIGHTS];
    if (!weights) return;

    const reputation = await this.prisma.reputation.findUnique({ where: { userId } });
    if (!reputation) return;

    const updateData: Prisma.ReputationUpdateInput = {};

    if (weights.activity) updateData.activityScore = { increment: weights.activity * multiplier };
    if (weights.expertise) updateData.expertiseScore = { increment: weights.expertise * multiplier };
    if (weights.trust) updateData.trustScore = { increment: Math.max(0, weights.trust * multiplier) };
    if (weights.contribution) updateData.contributionScore = { increment: weights.contribution * multiplier };

    updateData.lastCalculated = new Date();

    const updated = await this.prisma.reputation.update({
      where: { userId },
      data: updateData,
    });

    const totalScore = updated.activityScore + updated.expertiseScore + updated.trustScore + updated.contributionScore;
    const level = Math.floor(Math.sqrt(totalScore / 10)) + 1;

    let tier = 'BRONZE';
    for (const t of this.TIER_THRESHOLDS) {
      if (totalScore >= t.min) tier = t.tier;
    }

    await this.prisma.reputation.update({
      where: { userId },
      data: { totalScore, level, tier: tier as any },
    });
  }

  async getReputation(userId: string) {
    return this.prisma.reputation.findUnique({ where: { userId } });
  }

  async getLeaderboard(page = 1, limit = 50) {
    const skip = (page - 1) * limit;
    return this.prisma.reputation.findMany({
      orderBy: { totalScore: 'desc' },
      skip,
      take: limit,
      include: {
        user: {
          select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
        },
      },
    });
  }
}
