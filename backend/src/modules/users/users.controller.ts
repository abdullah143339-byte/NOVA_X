/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Controller, Get, Patch, Post, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorator';
import { CurrentUser, CurrentUserId } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getMe(@CurrentUser('id') userId: string) {
    return ApiResponseDto.ok(await this.usersService.getProfile(userId));
  }

  @Get('recommended')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async recommended(@CurrentUser('id') userId: string, @Query('limit') limit?: number) {
    return ApiResponseDto.ok(await this.usersService.getRecommended(userId, limit || 6));
  }

  @Get(':username')
  @UseGuards(OptionalJwtAuthGuard)
  async getByUsername(@Param('username') username: string, @CurrentUserId() viewerId?: string) {
    return ApiResponseDto.ok(await this.usersService.getByUsername(username, viewerId));
  }

  @Patch('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async updateMe(@CurrentUser('id') userId: string, @Body() body: any) {
    return ApiResponseDto.ok(await this.usersService.updateProfile(userId, body));
  }

  @Post(':id/follow')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async follow(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return ApiResponseDto.ok(await this.usersService.follow(userId, targetId));
  }

  @Post(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async block(@CurrentUser('id') userId: string, @Param('id') targetId: string, @Body() body: { reason?: string }) {
    return ApiResponseDto.ok(await this.usersService.blockUser(userId, targetId, body?.reason));
  }

  @Delete(':id/block')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async unblock(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return ApiResponseDto.ok(await this.usersService.unblockUser(userId, targetId));
  }

  @Get('me/blocked')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async getBlocked(@CurrentUser('id') userId: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return ApiResponseDto.ok(await this.usersService.getBlockedUsers(userId, page || 1, limit || 20));
  }

  @Get(':id/block-status')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async blockStatus(@CurrentUser('id') userId: string, @Param('id') targetId: string) {
    return ApiResponseDto.ok(await this.usersService.getBlockStatus(userId, targetId));
  }

  @Post(':id/report')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async report(@CurrentUser('id') userId: string, @Param('id') targetId: string, @Body() body: { reason: string; description?: string }) {
    return ApiResponseDto.ok(await this.usersService.reportUser(userId, targetId, body?.reason, body?.description));
  }

  @Get('search/q')
  @Public()
  async search(@Query('q') query: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return ApiResponseDto.ok(await this.usersService.search(query || '', page || 1, limit || 20));
  }

  @Get(':username/followers')
  @UseGuards(OptionalJwtAuthGuard)
  async getFollowers(
    @Param('username') username: string,
    @CurrentUserId() viewerId: string | undefined,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return ApiResponseDto.ok(await this.usersService.getFollowers(username, viewerId, page || 1, limit || 20));
  }

  @Get(':username/following')
  @UseGuards(OptionalJwtAuthGuard)
  async getFollowing(
    @Param('username') username: string,
    @CurrentUserId() viewerId: string | undefined,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    return ApiResponseDto.ok(await this.usersService.getFollowing(username, viewerId, page || 1, limit || 20));
  }
}
