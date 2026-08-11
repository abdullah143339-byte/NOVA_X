import { Controller, Get, Delete, Post, Patch, Param, Query, Body, UseGuards, ParseIntPipe, DefaultValuePipe } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../../common/decorators/auth.decorator';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@ApiBearerAuth()
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Get system stats' })
  async getStats() {
    const data = await this.adminService.getStats();
    return { success: true, data };
  }

  @Get('health')
  @ApiOperation({ summary: 'Get system health & DB monitoring' })
  async getHealth() {
    const data = await this.adminService.getHealth();
    return { success: true, data };
  }

  // ===== USERS =====

  @Get('users')
  @ApiOperation({ summary: 'Get all users' })
  async getUsers(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getUsers(page, limit);
    return { success: true, data };
  }

  @Delete('users/:id')
  @ApiOperation({ summary: 'Delete user permanently' })
  async deleteUser(@CurrentUser('id') adminId: string, @Param('id') userId: string) {
    const data = await this.adminService.deleteUser(adminId, userId);
    return { success: true, data };
  }

  @Post('users/:id/ban')
  @ApiOperation({ summary: 'Ban user' })
  async banUser(@CurrentUser('id') adminId: string, @Param('id') userId: string) {
    const data = await this.adminService.banUser(adminId, userId);
    return { success: true, data };
  }

  @Post('users/:id/unban')
  @ApiOperation({ summary: 'Unban user' })
  async unbanUser(@CurrentUser('id') adminId: string, @Param('id') userId: string) {
    const data = await this.adminService.unbanUser(adminId, userId);
    return { success: true, data };
  }

  @Post('users/:id/suspend')
  @ApiOperation({ summary: 'Suspend user' })
  async suspendUser(@CurrentUser('id') adminId: string, @Param('id') userId: string) {
    const data = await this.adminService.suspendUser(adminId, userId);
    return { success: true, data };
  }

  @Post('users/:id/warn')
  @ApiOperation({ summary: 'Warn user' })
  async warnUser(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body() body: { reason?: string },
  ) {
    const data = await this.adminService.warnUser(adminId, userId, body?.reason);
    return { success: true, data };
  }

  @Patch('users/:id/role')
  @ApiOperation({ summary: 'Update user role' })
  async updateUserRole(
    @CurrentUser('id') adminId: string,
    @Param('id') userId: string,
    @Body() body: { role: string },
  ) {
    const data = await this.adminService.updateUserRole(adminId, userId, body?.role);
    return { success: true, data };
  }

  // ===== ROLES =====

  @Get('roles')
  @ApiOperation({ summary: 'Get role distribution & members' })
  async getRoles() {
    const data = await this.adminService.getRoles();
    return { success: true, data };
  }

  // ===== CONTENT (posts / reels / stories / comments) =====

  @Get('posts')
  @ApiOperation({ summary: 'Get all posts' })
  async getPosts(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getPosts(page, limit);
    return { success: true, data };
  }

  @Delete('posts/:id')
  @ApiOperation({ summary: 'Delete any post' })
  async deletePost(@CurrentUser('id') adminId: string, @Param('id') postId: string) {
    const data = await this.adminService.deletePost(adminId, postId);
    return { success: true, data };
  }

  @Post('posts/:id/publish')
  @ApiOperation({ summary: 'Approve & publish a post' })
  async publishPost(@CurrentUser('id') adminId: string, @Param('id') postId: string) {
    const data = await this.adminService.publishPost(adminId, postId);
    return { success: true, data };
  }

  @Get('reels')
  @ApiOperation({ summary: 'Get reels (video posts)' })
  async getReels(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getReels(page, limit);
    return { success: true, data };
  }

  @Get('stories')
  @ApiOperation({ summary: 'Get stories (story posts)' })
  async getStories(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getStories(page, limit);
    return { success: true, data };
  }

  @Get('comments')
  @ApiOperation({ summary: 'Get all comments' })
  async getComments(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getComments(page, limit);
    return { success: true, data };
  }

  @Delete('comments/:id')
  @ApiOperation({ summary: 'Delete any comment' })
  async deleteComment(@CurrentUser('id') adminId: string, @Param('id') commentId: string) {
    const data = await this.adminService.deleteComment(adminId, commentId);
    return { success: true, data };
  }

  // ===== REPORTS =====

  @Get('reports')
  @ApiOperation({ summary: 'Get all content reports' })
  async getReports(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getReports(page, limit);
    return { success: true, data };
  }

  @Post('reports/:id/resolve')
  @ApiOperation({ summary: 'Resolve a report' })
  async resolveReport(
    @CurrentUser('id') adminId: string,
    @Param('id') reportId: string,
    @Body() body: { resolution?: string },
  ) {
    const data = await this.adminService.resolveReport(adminId, reportId, body?.resolution);
    return { success: true, data };
  }

  @Post('reports/:id/dismiss')
  @ApiOperation({ summary: 'Dismiss a report' })
  async dismissReport(@CurrentUser('id') adminId: string, @Param('id') reportId: string) {
    const data = await this.adminService.dismissReport(adminId, reportId);
    return { success: true, data };
  }

  // ===== COMMUNITIES =====

  @Get('communities')
  @ApiOperation({ summary: 'Get all communities' })
  async getCommunities(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getCommunities(page, limit);
    return { success: true, data };
  }

  @Delete('communities/:id')
  @ApiOperation({ summary: 'Delete community' })
  async deleteCommunity(@CurrentUser('id') adminId: string, @Param('id') communityId: string) {
    const data = await this.adminService.deleteCommunity(adminId, communityId);
    return { success: true, data };
  }

  // ===== MARKETPLACE =====

  @Get('marketplace')
  @ApiOperation({ summary: 'Get all marketplace items' })
  async getMarketplaceItems(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getMarketplaceItems(page, limit);
    return { success: true, data };
  }

  @Patch('marketplace/:id/status')
  @ApiOperation({ summary: 'Update marketplace item status' })
  async updateItemStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') itemId: string,
    @Body() body: { status: string },
  ) {
    const data = await this.adminService.updateItemStatus(adminId, itemId, body?.status);
    return { success: true, data };
  }

  @Post('marketplace/:id/feature')
  @ApiOperation({ summary: 'Toggle item featured' })
  async toggleItemFeatured(@CurrentUser('id') adminId: string, @Param('id') itemId: string) {
    const data = await this.adminService.toggleItemFeatured(adminId, itemId);
    return { success: true, data };
  }

  @Get('orders')
  @ApiOperation({ summary: 'Get all orders' })
  async getOrders(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getOrders(page, limit);
    return { success: true, data };
  }

  @Patch('orders/:id/status')
  @ApiOperation({ summary: 'Update order status' })
  async updateOrderStatus(
    @CurrentUser('id') adminId: string,
    @Param('id') orderId: string,
    @Body() body: { status: string },
  ) {
    const data = await this.adminService.updateOrderStatus(adminId, orderId, body?.status);
    return { success: true, data };
  }

  @Get('reviews')
  @ApiOperation({ summary: 'Get all product reviews' })
  async getReviews(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getReviews(page, limit);
    return { success: true, data };
  }

  @Delete('reviews/:id')
  @ApiOperation({ summary: 'Delete any review' })
  async deleteReview(@CurrentUser('id') adminId: string, @Param('id') reviewId: string) {
    const data = await this.adminService.deleteReview(adminId, reviewId);
    return { success: true, data };
  }

  // ===== MESSAGES / AI =====

  @Get('messages')
  @ApiOperation({ summary: 'Get messages metadata overview' })
  async getMessagesOverview(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getMessagesOverview(page, limit);
    return { success: true, data };
  }

  @Get('ai/overview')
  @ApiOperation({ summary: 'Get AI usage overview' })
  async getAiOverview() {
    const data = await this.adminService.getAiOverview();
    return { success: true, data };
  }

  // ===== ANALYTICS / FINANCIALS =====

  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get analytics time series' })
  async getAnalyticsOverview(@Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number) {
    const data = await this.adminService.getAnalyticsOverview(Math.min(days, 90));
    return { success: true, data };
  }

  @Get('financials')
  @ApiOperation({ summary: 'Get financial reports' })
  async getFinancials() {
    const data = await this.adminService.getFinancials();
    return { success: true, data };
  }

  // ===== AUDIT LOGS =====

  @Get('audit-logs')
  @ApiOperation({ summary: 'Get all audit log entries' })
  async getAuditLogs(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getAuditLogs(page, limit);
    return { success: true, data };
  }

  // ===== SECURITY =====

  @Get('security/events')
  @ApiOperation({ summary: 'Get all security events' })
  async getSecurityEvents(@Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number, @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number) {
    const data = await this.adminService.getSecurityEvents(page, limit);
    return { success: true, data };
  }

  @Post('security/events/:id/resolve')
  @ApiOperation({ summary: 'Resolve a security event' })
  async resolveSecurityEvent(@CurrentUser('id') adminId: string, @Param('id') eventId: string) {
    const data = await this.adminService.resolveSecurityEvent(adminId, eventId);
    return { success: true, data };
  }

  // ===== NOTIFICATIONS =====

  @Post('notifications/broadcast')
  @ApiOperation({ summary: 'Broadcast notification to all users' })
  async broadcastNotification(
    @CurrentUser('id') adminId: string,
    @Body() body: { title: string; body?: string },
  ) {
    const data = await this.adminService.broadcastNotification(adminId, body?.title, body?.body);
    return { success: true, data };
  }
}
