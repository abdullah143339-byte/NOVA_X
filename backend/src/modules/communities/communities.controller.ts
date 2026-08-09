/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Controller, Get, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { CommunitiesService } from './communities.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Communities')
@Controller('communities')
export class CommunitiesController {
  constructor(private communitiesService: CommunitiesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async create(@CurrentUser('id') userId: string, @Body() body: any) {
    return ApiResponseDto.ok(await this.communitiesService.create(userId, body), 'Community created');
  }

  @Get()
  @Public()
  async getAll(@Query('page') page?: number, @Query('category') category?: string) {
    return ApiResponseDto.ok(await this.communitiesService.getAll(page || 1, 20, category));
  }

  @Get(':slug')
  @Public()
  async getBySlug(@Param('slug') slug: string) {
    return ApiResponseDto.ok(await this.communitiesService.getBySlug(slug));
  }

  @Post(':id/join')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async join(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return ApiResponseDto.ok(await this.communitiesService.join(id, userId));
  }

  @Delete(':id/leave')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async leave(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return ApiResponseDto.ok(await this.communitiesService.leave(id, userId));
  }
}
