/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StoriesService } from './stories.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Stories')
@Controller('stories')
export class StoriesController {
  constructor(private storiesService: StoriesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async createStory(@CurrentUser('id') userId: string, @Body() body: { media: string; mediaType?: string; caption?: string }) {
    if (!body.media) throw new NotFoundException('Story media is required');
    return ApiResponseDto.ok(
      await this.storiesService.createStory(userId, body.media, body.mediaType || 'IMAGE', body.caption),
      'Story created',
    );
  }

  @Get('feed')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getStoryFeed(@CurrentUser('id') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return ApiResponseDto.ok(await this.storiesService.getStoryFeed(userId, page || 1, limit || 30));
  }

  @Get('user/:userId')
  @UseGuards(OptionalJwtAuthGuard)
  async getUserStories(@CurrentUser('id') viewerId: string | undefined, @Param('userId') userId: string) {
    return ApiResponseDto.ok(await this.storiesService.getUserStories(userId, viewerId));
  }

  @Get(':id/views')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getStoryViews(@CurrentUser('id') userId: string, @Param('id') storyId: string) {
    return ApiResponseDto.ok(await this.storiesService.getStoryViews(storyId, userId));
  }

  @Post(':id/view')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async markStoryViewed(@CurrentUser('id') userId: string, @Param('id') storyId: string) {
    return ApiResponseDto.ok(await this.storiesService.markStoryViewed(storyId, userId), 'Story marked as viewed');
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async deleteStory(@CurrentUser('id') userId: string, @Param('id') storyId: string) {
    return ApiResponseDto.ok(await this.storiesService.deleteStory(storyId, userId), 'Story deleted');
  }
}