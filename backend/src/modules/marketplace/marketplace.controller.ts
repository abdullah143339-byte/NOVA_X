/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Controller, Get, Post, Param, Body, Query, UseGuards, Req, Headers, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { MarketplaceService } from './marketplace.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private marketplaceService: MarketplaceService) {}

  @Post('webhooks/payment')
  @Public()
  @HttpCode(HttpStatus.OK)
  async paymentWebhook(@Req() req: Request, @Headers('x-payment-signature') signature?: string) {
    const payload = (req.body ?? {}) as Record<string, unknown>;
    const provider = typeof payload.provider === 'string' ? payload.provider : 'unknown';
    const result = await this.marketplaceService.recordWebhook(provider, payload, signature);
    return ApiResponseDto.ok({ received: true, handled: result.handled, provider });
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@CurrentUser('id') userId: string, @Body() body: any) {
    return ApiResponseDto.ok(await this.marketplaceService.create(userId, body));
  }

  @Get()
  @Public()
  async getAll(@Query('page') page?: number, @Query('type') type?: string, @Query('category') category?: string, @Query('sellerId') sellerId?: string) {
    return ApiResponseDto.ok(await this.marketplaceService.getAll(page || 1, 20, type, category, sellerId));
  }

  @Get(':id')
  @Public()
  async getById(@Param('id') id: string) {
    return ApiResponseDto.ok(await this.marketplaceService.getById(id));
  }

  @Post(':id/purchase')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async purchase(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return ApiResponseDto.ok(await this.marketplaceService.purchase(id, userId));
  }
}
