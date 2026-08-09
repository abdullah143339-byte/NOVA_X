/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException, ForbiddenException, BadRequestException, ConflictException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class MarketplaceService {
  private readonly logger = new Logger(MarketplaceService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  /**
   * Placeholder webhook receiver for payment verification (Stripe / Razorpay /
   * PayPal etc.). TODO: verify the signature against PAYMENT_WEBHOOK_SECRET and
   * reconcile purchases/orders here.
   */
  async recordWebhook(provider: string, payload: Record<string, unknown>, signature?: string): Promise<{ handled: boolean }> {
    const secret = this.configService.get<string>('PAYMENT_WEBHOOK_SECRET');
    if (secret && signature && signature !== secret) {
      this.logger.warn(`Webhook signature mismatch for provider=${provider}`);
      return { handled: false };
    }
    this.logger.log(`Payment webhook received provider=${provider} event=${payload.type ?? 'unknown'}`);
    return { handled: false };
  }

  async create(sellerId: string, data: any) {
    const allowed = {
      title: data.title,
      description: data.description,
      price: typeof data.price === 'number' ? data.price : parseFloat(data.price),
      category: data.category,
      type: data.type || 'TEMPLATE',
      currency: 'PKR',
      contact: typeof data.contact === 'string' && data.contact.trim() ? data.contact.trim() : undefined,
      images: Array.isArray(data.images) ? data.images : undefined,
      files: Array.isArray(data.files) ? data.files : undefined,
      status: 'ACTIVE' as any,
    };
    if (!allowed.title || typeof allowed.price !== 'number' || isNaN(allowed.price)) {
      throw new BadRequestException('title and a valid numeric price are required');
    }
    return this.prisma.marketplaceItem.create({
      data: { ...allowed, sellerId },
    });
  }

  async getAll(page = 1, limit = 20, type?: string, category?: string, sellerId?: string) {
    const skip = (page - 1) * limit;
    const where: any = { status: 'ACTIVE' };
    if (type) where.type = type;
    if (category) where.category = category;
    if (sellerId) where.sellerId = sellerId;
    const [items, total] = await Promise.all([
      this.prisma.marketplaceItem.findMany({
        where, skip, take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.marketplaceItem.count({ where }),
    ]);
    return { items, total, page, totalPages: Math.ceil(total / limit) };
  }

  async getById(id: string) {
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Item not found');
    await this.prisma.marketplaceItem.update({ where: { id }, data: { viewCount: { increment: 1 } } });
    return item;
  }

  async purchase(itemId: string, buyerId: string) {
    const item = await this.prisma.marketplaceItem.findUnique({ where: { id: itemId } });
    if (!item) throw new NotFoundException('Item not found');
    if (item.status !== 'ACTIVE') throw new ForbiddenException('This item is not available for purchase');
    if (item.sellerId === buyerId) throw new ForbiddenException('Cannot buy your own item');
    const alreadyBought = await this.prisma.purchase.findFirst({
      where: { itemId, buyerId },
    });
    if (alreadyBought) throw new ConflictException('You already purchased this item');
    const [purchase] = await this.prisma.$transaction([
      this.prisma.purchase.create({
        data: { itemId, buyerId, amount: item.price, currency: item.currency || 'USD' },
      }),
      this.prisma.marketplaceItem.update({
        where: { id: itemId },
        data: { salesCount: { increment: 1 } },
      }),
    ]);
    return purchase;
  }
}
