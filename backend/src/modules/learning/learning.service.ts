/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
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

type TagsArray = string[];

const tagsToDb = (tags?: TagsArray): string | undefined =>
  tags !== undefined ? JSON.stringify(tags) : undefined;

const tagsFromDb = (raw: string | null | undefined): TagsArray => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((t) => typeof t === 'string') : [];
  } catch {
    return [];
  }
};

const tsToDate = (ts?: number | null): Date | null | undefined =>
  ts === undefined || ts === null ? (ts ?? undefined) : new Date(ts);

const dateToTs = (d: Date | null | undefined): number | null | undefined =>
  d === undefined || d === null ? (d ?? undefined) : d.getTime();

@Injectable()
export class LearningService {
  constructor(private prisma: PrismaService) {}

  // ---------- State ----------

  async getState(userId: string) {
    const [subjects, notes, lectures, files, tasks, bookmarks, sessions] = await Promise.all([
      this.prisma.learningSubject.findMany({ where: { userId }, orderBy: { createdAt: 'asc' } }),
      this.prisma.learningNote.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.learningLecture.findMany({ where: { userId }, orderBy: { updatedAt: 'desc' } }),
      this.prisma.learningFile.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.learningTask.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.learningBookmark.findMany({ where: { userId }, orderBy: { createdAt: 'desc' } }),
      this.prisma.studySession.findMany({ where: { userId }, orderBy: { date: 'asc' } }),
    ]);

    return {
      subjects: subjects.map((s) => ({
        id: s.id,
        name: s.name,
        emoji: s.emoji,
        color: s.color,
        description: s.description,
        archived: s.archived,
        trashed: s.trashed,
        createdAt: dateToTs(s.createdAt),
        updatedAt: dateToTs(s.updatedAt),
      })),
      notes: notes.map((n) => ({
        id: n.id,
        subjectId: n.subjectId,
        title: n.title,
        content: n.content,
        tags: tagsFromDb(n.tags),
        pinned: n.pinned,
        favorite: n.favorite,
        archived: n.archived,
        trashed: n.trashed,
        createdAt: dateToTs(n.createdAt),
        updatedAt: dateToTs(n.updatedAt),
      })),
      lectures: lectures.map((l) => ({
        id: l.id,
        subjectId: l.subjectId,
        title: l.title,
        description: l.description,
        teacher: l.teacher,
        tags: tagsFromDb(l.tags),
        source: l.source,
        url: l.url,
        mediaUrl: l.mediaUrl,
        durationMin: l.durationMin,
        completed: l.completed,
        favorite: l.favorite,
        archived: l.archived,
        trashed: l.trashed,
        createdAt: dateToTs(l.createdAt),
        updatedAt: dateToTs(l.updatedAt),
      })),
      files: files.map((f) => ({
        id: f.id,
        subjectId: f.subjectId,
        name: f.name,
        kind: f.kind,
        size: f.size,
        mime: f.mime,
        dataUrl: f.dataUrl,
        tags: tagsFromDb(f.tags),
        favorite: f.favorite,
        archived: f.archived,
        trashed: f.trashed,
        createdAt: dateToTs(f.createdAt),
      })),
      tasks: tasks.map((t) => ({
        id: t.id,
        subjectId: t.subjectId,
        title: t.title,
        notes: t.notes,
        deadline: dateToTs(t.deadline),
        reminderAt: dateToTs(t.reminderAt),
        priority: t.priority,
        completed: t.completed,
        archived: t.archived,
        trashed: t.trashed,
        createdAt: dateToTs(t.createdAt),
      })),
      bookmarks: bookmarks.map((b) => ({
        id: b.id,
        refType: b.refType,
        refId: b.refId,
        createdAt: dateToTs(b.createdAt),
      })),
      sessions: sessions.map((s) => ({ date: s.date, minutes: s.minutes })),
    };
  }

  private async ensureOwned(userId: string, model: 'subject' | 'note' | 'lecture' | 'file' | 'task', id: string): Promise<{ id: string }> {
    const tables: Record<string, { findFirst: (args: any) => Promise<{ id: string } | null> }> = {
      subject: this.prisma.learningSubject,
      note: this.prisma.learningNote,
      lecture: this.prisma.learningLecture,
      file: this.prisma.learningFile,
      task: this.prisma.learningTask,
    };
    const row = await tables[model].findFirst({ where: { id, userId }, select: { id: true } });
    if (!row) throw new NotFoundException(`${model} not found`);
    return row;
  }

  // ---------- Subjects ----------

  createSubject(userId: string, dto: CreateLearningSubjectDto) {
    return this.prisma.learningSubject.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        name: dto.name,
        emoji: dto.emoji || '📚',
        color: dto.color || 'violet',
        description: dto.description || '',
      },
    });
  }

  async updateSubject(userId: string, id: string, dto: UpdateLearningSubjectDto) {
    await this.ensureOwned(userId, 'subject', id);
    return this.prisma.learningSubject.update({
      where: { id },
      data: {
        name: dto.name,
        emoji: dto.emoji,
        color: dto.color,
        description: dto.description,
        archived: dto.archived,
        trashed: dto.trashed,
      },
    });
  }

  async trashSubject(userId: string, id: string) {
    await this.ensureOwned(userId, 'subject', id);
    await this.prisma.learningSubject.update({ where: { id }, data: { trashed: true } });
    return { message: 'Subject moved to trash' };
  }

  async restoreSubject(userId: string, id: string) {
    await this.ensureOwned(userId, 'subject', id);
    await this.prisma.learningSubject.update({ where: { id }, data: { trashed: false, archived: false } });
    return { message: 'Subject restored' };
  }

  async deleteSubjectForever(userId: string, id: string) {
    await this.ensureOwned(userId, 'subject', id);
    await this.prisma.learningSubject.delete({ where: { id } });
    return { message: 'Subject deleted permanently' };
  }

  // ---------- Notes ----------

  createNote(userId: string, dto: CreateLearningNoteDto) {
    return this.prisma.learningNote.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        subjectId: dto.subjectId,
        title: dto.title || '',
        content: dto.content || '',
        tags: tagsToDb(dto.tags),
        pinned: dto.pinned ?? false,
        favorite: dto.favorite ?? false,
      },
    });
  }

  async updateNote(userId: string, id: string, dto: UpdateLearningNoteDto) {
    await this.ensureOwned(userId, 'note', id);
    return this.prisma.learningNote.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        title: dto.title,
        content: dto.content,
        tags: tagsToDb(dto.tags),
        pinned: dto.pinned,
        favorite: dto.favorite,
        archived: dto.archived,
        trashed: dto.trashed,
      },
    });
  }

  async trashNote(userId: string, id: string) {
    await this.ensureOwned(userId, 'note', id);
    await this.prisma.learningNote.update({ where: { id }, data: { trashed: true } });
    return { message: 'Note moved to trash' };
  }

  async restoreNote(userId: string, id: string) {
    await this.ensureOwned(userId, 'note', id);
    await this.prisma.learningNote.update({ where: { id }, data: { trashed: false, archived: false } });
    return { message: 'Note restored' };
  }

  async deleteNoteForever(userId: string, id: string) {
    await this.ensureOwned(userId, 'note', id);
    await this.prisma.learningBookmark.deleteMany({ where: { userId, refType: 'note', refId: id } });
    await this.prisma.learningNote.delete({ where: { id } });
    return { message: 'Note deleted permanently' };
  }

  // ---------- Lectures ----------

  createLecture(userId: string, dto: CreateLearningLectureDto) {
    return this.prisma.learningLecture.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        subjectId: dto.subjectId,
        title: dto.title,
        description: dto.description || '',
        teacher: dto.teacher || '',
        tags: tagsToDb(dto.tags),
        source: dto.source || 'youtube',
        url: dto.url || '',
        mediaUrl: dto.mediaUrl || '',
        durationMin: dto.durationMin,
        completed: dto.completed ?? false,
        favorite: dto.favorite ?? false,
      },
    });
  }

  async updateLecture(userId: string, id: string, dto: UpdateLearningLectureDto) {
    await this.ensureOwned(userId, 'lecture', id);
    return this.prisma.learningLecture.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        title: dto.title,
        description: dto.description,
        teacher: dto.teacher,
        tags: tagsToDb(dto.tags),
        source: dto.source,
        url: dto.url,
        mediaUrl: dto.mediaUrl,
        durationMin: dto.durationMin,
        completed: dto.completed,
        favorite: dto.favorite,
        archived: dto.archived,
        trashed: dto.trashed,
      },
    });
  }

  async trashLecture(userId: string, id: string) {
    await this.ensureOwned(userId, 'lecture', id);
    await this.prisma.learningLecture.update({ where: { id }, data: { trashed: true } });
    return { message: 'Lecture moved to trash' };
  }

  async restoreLecture(userId: string, id: string) {
    await this.ensureOwned(userId, 'lecture', id);
    await this.prisma.learningLecture.update({ where: { id }, data: { trashed: false, archived: false } });
    return { message: 'Lecture restored' };
  }

  async deleteLectureForever(userId: string, id: string) {
    await this.ensureOwned(userId, 'lecture', id);
    await this.prisma.learningBookmark.deleteMany({ where: { userId, refType: 'lecture', refId: id } });
    await this.prisma.learningLecture.delete({ where: { id } });
    return { message: 'Lecture deleted permanently' };
  }

  // ---------- Files ----------

  createFile(userId: string, dto: CreateLearningFileDto) {
    return this.prisma.learningFile.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        subjectId: dto.subjectId,
        name: dto.name,
        kind: dto.kind,
        size: dto.size || 0,
        mime: dto.mime || '',
        dataUrl: dto.dataUrl || '',
        tags: tagsToDb(dto.tags),
        favorite: dto.favorite ?? false,
      },
    });
  }

  async updateFile(userId: string, id: string, dto: UpdateLearningFileDto) {
    await this.ensureOwned(userId, 'file', id);
    return this.prisma.learningFile.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        name: dto.name,
        kind: dto.kind,
        size: dto.size,
        mime: dto.mime,
        dataUrl: dto.dataUrl,
        tags: tagsToDb(dto.tags),
        favorite: dto.favorite,
        archived: dto.archived,
        trashed: dto.trashed,
      },
    });
  }

  async trashFile(userId: string, id: string) {
    await this.ensureOwned(userId, 'file', id);
    await this.prisma.learningFile.update({ where: { id }, data: { trashed: true } });
    return { message: 'File moved to trash' };
  }

  async restoreFile(userId: string, id: string) {
    await this.ensureOwned(userId, 'file', id);
    await this.prisma.learningFile.update({ where: { id }, data: { trashed: false, archived: false } });
    return { message: 'File restored' };
  }

  async deleteFileForever(userId: string, id: string) {
    await this.ensureOwned(userId, 'file', id);
    await this.prisma.learningBookmark.deleteMany({ where: { userId, refType: 'file', refId: id } });
    await this.prisma.learningFile.delete({ where: { id } });
    return { message: 'File deleted permanently' };
  }

  // ---------- Tasks ----------

  createTask(userId: string, dto: CreateLearningTaskDto) {
    return this.prisma.learningTask.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        subjectId: dto.subjectId,
        title: dto.title,
        notes: dto.notes || '',
        deadline: tsToDate(dto.deadline),
        reminderAt: tsToDate(dto.reminderAt),
        priority: dto.priority || 'medium',
        completed: dto.completed ?? false,
      },
    });
  }

  async updateTask(userId: string, id: string, dto: UpdateLearningTaskDto) {
    await this.ensureOwned(userId, 'task', id);
    return this.prisma.learningTask.update({
      where: { id },
      data: {
        subjectId: dto.subjectId,
        title: dto.title,
        notes: dto.notes,
        deadline: tsToDate(dto.deadline),
        reminderAt: tsToDate(dto.reminderAt),
        priority: dto.priority,
        completed: dto.completed,
        archived: dto.archived,
        trashed: dto.trashed,
      },
    });
  }

  async trashTask(userId: string, id: string) {
    await this.ensureOwned(userId, 'task', id);
    await this.prisma.learningTask.update({ where: { id }, data: { trashed: true } });
    return { message: 'Task moved to trash' };
  }

  async restoreTask(userId: string, id: string) {
    await this.ensureOwned(userId, 'task', id);
    await this.prisma.learningTask.update({ where: { id }, data: { trashed: false, archived: false } });
    return { message: 'Task restored' };
  }

  async deleteTaskForever(userId: string, id: string) {
    await this.ensureOwned(userId, 'task', id);
    await this.prisma.learningTask.delete({ where: { id } });
    return { message: 'Task deleted permanently' };
  }

  // ---------- Bookmarks ----------

  async toggleBookmark(userId: string, dto: ToggleLearningBookmarkDto) {
    const existing = await this.prisma.learningBookmark.findFirst({
      where: { userId, refType: dto.refType, refId: dto.refId },
    });
    if (existing) {
      await this.prisma.learningBookmark.delete({ where: { id: existing.id } });
      return { bookmarked: false, id: existing.id };
    }
    const created = await this.prisma.learningBookmark.create({
      data: {
        ...(dto.id ? { id: dto.id } : {}),
        userId,
        refType: dto.refType,
        refId: dto.refId,
      },
    });
    return { bookmarked: true, id: created.id };
  }

  async removeBookmark(userId: string, refType: string, refId: string) {
    await this.prisma.learningBookmark.deleteMany({ where: { userId, refType, refId } });
    return { message: 'Bookmark removed' };
  }

  // ---------- Study Sessions ----------

  async trackSession(userId: string, dto: TrackStudySessionDto) {
    const date = dto.date || new Date().toISOString().slice(0, 10);
    const existing = await this.prisma.studySession.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing) {
      await this.prisma.studySession.update({
        where: { id: existing.id },
        data: { minutes: existing.minutes + Math.max(0, Math.round(dto.minutes)) },
      });
    } else {
      await this.prisma.studySession.create({
        data: { userId, date, minutes: Math.max(0, Math.round(dto.minutes)) },
      });
    }
    return { message: 'Study session tracked' };
  }

  // ---------- Reset ----------

  async resetAll(userId: string) {
    await this.prisma.learningBookmark.deleteMany({ where: { userId } });
    await this.prisma.studySession.deleteMany({ where: { userId } });
    await this.prisma.learningTask.deleteMany({ where: { userId } });
    await this.prisma.learningFile.deleteMany({ where: { userId } });
    await this.prisma.learningLecture.deleteMany({ where: { userId } });
    await this.prisma.learningNote.deleteMany({ where: { userId } });
    await this.prisma.learningSubject.deleteMany({ where: { userId } });
    return { message: 'Learning workspace reset' };
  }
}
