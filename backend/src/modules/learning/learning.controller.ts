import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { LearningService } from './learning.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUserId } from '../../common/decorators/user.decorator';
import { ApiResponseDto } from '../../common/dto/api-response.dto';
import {
  CreateLearningSubjectDto,
  UpdateLearningSubjectDto,
  CreateLearningNoteDto,
  UpdateLearningNoteDto,
  CreateLearningLectureDto,
  UpdateLearningLectureDto,
  CreateLearningFileDto,
  UpdateLearningFileDto,
  CreateLearningTaskDto,
  UpdateLearningTaskDto,
  ToggleLearningBookmarkDto,
  TrackStudySessionDto,
} from './learning.dto';

@ApiTags('Learning')
@Controller('learning')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class LearningController {
  constructor(private learningService: LearningService) {}

  @Get('state')
  async getState(@CurrentUserId() userId: string) {
    return ApiResponseDto.ok(await this.learningService.getState(userId), 'Learning state loaded');
  }

  // ---------- Subjects ----------

  @Post('subjects')
  async createSubject(@CurrentUserId() userId: string, @Body() dto: CreateLearningSubjectDto) {
    return ApiResponseDto.ok(await this.learningService.createSubject(userId, dto), 'Subject created');
  }

  @Patch('subjects/:id')
  async updateSubject(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateLearningSubjectDto) {
    return ApiResponseDto.ok(await this.learningService.updateSubject(userId, id, dto), 'Subject updated');
  }

  @Delete('subjects/:id')
  async trashSubject(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.trashSubject(userId, id), 'Subject moved to trash');
  }

  @Post('subjects/:id/restore')
  async restoreSubject(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.restoreSubject(userId, id), 'Subject restored');
  }

  @Delete('subjects/:id/permanent')
  async deleteSubjectForever(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.deleteSubjectForever(userId, id), 'Subject deleted permanently');
  }

  // ---------- Notes ----------

  @Post('notes')
  async createNote(@CurrentUserId() userId: string, @Body() dto: CreateLearningNoteDto) {
    return ApiResponseDto.ok(await this.learningService.createNote(userId, dto), 'Note created');
  }

  @Patch('notes/:id')
  async updateNote(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateLearningNoteDto) {
    return ApiResponseDto.ok(await this.learningService.updateNote(userId, id, dto), 'Note updated');
  }

  @Delete('notes/:id')
  async trashNote(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.trashNote(userId, id), 'Note moved to trash');
  }

  @Post('notes/:id/restore')
  async restoreNote(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.restoreNote(userId, id), 'Note restored');
  }

  @Delete('notes/:id/permanent')
  async deleteNoteForever(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.deleteNoteForever(userId, id), 'Note deleted permanently');
  }

  // ---------- Lectures ----------

  @Post('lectures')
  async createLecture(@CurrentUserId() userId: string, @Body() dto: CreateLearningLectureDto) {
    return ApiResponseDto.ok(await this.learningService.createLecture(userId, dto), 'Lecture created');
  }

  @Patch('lectures/:id')
  async updateLecture(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateLearningLectureDto) {
    return ApiResponseDto.ok(await this.learningService.updateLecture(userId, id, dto), 'Lecture updated');
  }

  @Delete('lectures/:id')
  async trashLecture(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.trashLecture(userId, id), 'Lecture moved to trash');
  }

  @Post('lectures/:id/restore')
  async restoreLecture(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.restoreLecture(userId, id), 'Lecture restored');
  }

  @Delete('lectures/:id/permanent')
  async deleteLectureForever(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.deleteLectureForever(userId, id), 'Lecture deleted permanently');
  }

  // ---------- Files ----------

  @Post('files')
  async createFile(@CurrentUserId() userId: string, @Body() dto: CreateLearningFileDto) {
    return ApiResponseDto.ok(await this.learningService.createFile(userId, dto), 'File saved');
  }

  @Patch('files/:id')
  async updateFile(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateLearningFileDto) {
    return ApiResponseDto.ok(await this.learningService.updateFile(userId, id, dto), 'File updated');
  }

  @Delete('files/:id')
  async trashFile(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.trashFile(userId, id), 'File moved to trash');
  }

  @Post('files/:id/restore')
  async restoreFile(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.restoreFile(userId, id), 'File restored');
  }

  @Delete('files/:id/permanent')
  async deleteFileForever(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.deleteFileForever(userId, id), 'File deleted permanently');
  }

  // ---------- Tasks ----------

  @Post('tasks')
  async createTask(@CurrentUserId() userId: string, @Body() dto: CreateLearningTaskDto) {
    return ApiResponseDto.ok(await this.learningService.createTask(userId, dto), 'Task created');
  }

  @Patch('tasks/:id')
  async updateTask(@CurrentUserId() userId: string, @Param('id') id: string, @Body() dto: UpdateLearningTaskDto) {
    return ApiResponseDto.ok(await this.learningService.updateTask(userId, id, dto), 'Task updated');
  }

  @Delete('tasks/:id')
  async trashTask(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.trashTask(userId, id), 'Task moved to trash');
  }

  @Post('tasks/:id/restore')
  async restoreTask(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.restoreTask(userId, id), 'Task restored');
  }

  @Delete('tasks/:id/permanent')
  async deleteTaskForever(@CurrentUserId() userId: string, @Param('id') id: string) {
    return ApiResponseDto.ok(await this.learningService.deleteTaskForever(userId, id), 'Task deleted permanently');
  }

  // ---------- Bookmarks ----------

  @Post('bookmarks')
  async toggleBookmark(@CurrentUserId() userId: string, @Body() dto: ToggleLearningBookmarkDto) {
    return ApiResponseDto.ok(await this.learningService.toggleBookmark(userId, dto), 'Bookmark toggled');
  }

  @Delete('bookmarks')
  async removeBookmark(
    @CurrentUserId() userId: string,
    @Query('refType') refType: string,
    @Query('refId') refId: string,
  ) {
    return ApiResponseDto.ok(await this.learningService.removeBookmark(userId, refType, refId), 'Bookmark removed');
  }

  // ---------- Study Sessions ----------

  @Post('sessions')
  async trackSession(@CurrentUserId() userId: string, @Body() dto: TrackStudySessionDto) {
    return ApiResponseDto.ok(await this.learningService.trackSession(userId, dto), 'Study session tracked');
  }

  @Post('reset')
  async reset(@CurrentUserId() userId: string) {
    return ApiResponseDto.ok(await this.learningService.resetAll(userId), 'Learning workspace reset');
  }
}
