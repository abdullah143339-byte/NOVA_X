import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { AiService } from './ai.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('AI')
@Controller('ai')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AiController {
  constructor(private aiService: AiService) {}

  @Post('conversations')
  async createConversation(@CurrentUser('id') userId: string, @Body('title') title?: string) {
    const result = await this.aiService.createConversation(userId, title);
    return ApiResponseDto.ok(result);
  }

  @Get('conversations')
  async getConversations(@CurrentUser('id') userId: string) {
    const result = await this.aiService.getConversations(userId);
    return ApiResponseDto.ok(result);
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') convId: string,
    @Body('content') content: string,
  ) {
    const result = await this.aiService.sendMessage(convId, userId, content);
    return ApiResponseDto.ok(result);
  }

  @Get('conversations/:id/messages')
  async getMessages(
    @CurrentUser('id') userId: string,
    @Param('id') convId: string,
    @Query('page') page?: number,
  ) {
    const result = await this.aiService.getMessages(convId, userId, page || 1);
    return ApiResponseDto.ok(result);
  }
}
