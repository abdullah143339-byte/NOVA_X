/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Messages')
@Controller('messages')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  @Get('conversations')
  async getConversations(@CurrentUser('id') userId: string) {
    return ApiResponseDto.ok(await this.messagesService.getConversations(userId));
  }

  @Post('conversations')
  async createConversation(@CurrentUser('id') userId: string, @Body() body: { participantIds?: string[]; participantId?: string; type?: string; name?: string }) {
    const participantIds = Array.isArray(body.participantIds)
      ? body.participantIds
      : body.participantId
        ? [body.participantId]
        : [];
    return ApiResponseDto.ok(await this.messagesService.createConversation(userId, participantIds, body.type, body.name));
  }

  @Post('conversations/:id/messages')
  async sendMessage(
    @CurrentUser('id') userId: string,
    @Param('id') convId: string,
    @Body() body: { content?: string; type?: string; media?: any; replyToId?: string },
  ) {
    return ApiResponseDto.ok(
      await this.messagesService.sendMessage(
        convId,
        userId,
        body.content || '',
        body.type || 'TEXT',
        body.media,
        body.replyToId,
      ),
    );
  }

  @Get('conversations/:id/messages')
  async getMessages(@CurrentUser('id') userId: string, @Param('id') convId: string, @Query('page') page?: number) {
    return ApiResponseDto.ok(await this.messagesService.getMessages(convId, userId, page || 1));
  }
}
