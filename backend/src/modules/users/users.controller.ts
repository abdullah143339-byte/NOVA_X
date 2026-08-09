/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Controller, Get, Patch, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Public } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';
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
  @Public()
  async getByUsername(@Param('username') username: string) {
    return ApiResponseDto.ok(await this.usersService.getByUsername(username));
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

  @Get('search/q')
  @Public()
  async search(@Query('q') query: string, @Query('page') page?: number, @Query('limit') limit?: number) {
    return ApiResponseDto.ok(await this.usersService.search(query || '', page || 1, limit || 20));
  }
}
