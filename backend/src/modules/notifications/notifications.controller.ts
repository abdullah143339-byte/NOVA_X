import { Controller, Get, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(@CurrentUser('id') userId: string, @Query('page') page?: number) {
    return ApiResponseDto.ok(await this.notificationsService.getNotifications(userId, page || 1));
  }

  @Patch(':id/read')
  async markAsRead(@CurrentUser('id') userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.notificationsService.markAsRead(userId, id));
  }

  @Patch('read-all')
  async markAllAsRead(@CurrentUser('id') userId: string) {
    return ApiResponseDto.ok(await this.notificationsService.markAllAsRead(userId));
  }
}
