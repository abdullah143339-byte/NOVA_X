import {
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

// ---------- Subjects ----------

export class CreateLearningSubjectDto {
  @IsOptional() @IsString() id?: string;
  @IsString() name: string;
  @IsOptional() @IsString() emoji?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() description?: string;
}

export class UpdateLearningSubjectDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() emoji?: string;
  @IsOptional() @IsString() color?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsBoolean() trashed?: boolean;
}

// ---------- Notes ----------

export class CreateLearningNoteDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() subjectId?: string | null;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsBoolean() favorite?: boolean;
}

export class UpdateLearningNoteDto {
  @IsOptional() @IsString() subjectId?: string | null;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() content?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() pinned?: boolean;
  @IsOptional() @IsBoolean() favorite?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsBoolean() trashed?: boolean;
}

// ---------- Lectures ----------

export class CreateLearningLectureDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() subjectId?: string | null;
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() teacher?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsIn(['youtube', 'upload']) source?: 'youtube' | 'upload';
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() mediaUrl?: string;
  @IsOptional() @IsNumber() durationMin?: number | null;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() favorite?: boolean;
}

export class UpdateLearningLectureDto {
  @IsOptional() @IsString() subjectId?: string | null;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() teacher?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsIn(['youtube', 'upload']) source?: 'youtube' | 'upload';
  @IsOptional() @IsString() url?: string;
  @IsOptional() @IsString() mediaUrl?: string;
  @IsOptional() @IsNumber() durationMin?: number | null;
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() favorite?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsBoolean() trashed?: boolean;
}

// ---------- Files ----------

export class CreateLearningFileDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() subjectId?: string | null;
  @IsString() name: string;
  @IsString() kind: string;
  @IsOptional() @IsNumber() size?: number;
  @IsOptional() @IsString() mime?: string;
  @IsOptional() @IsString() dataUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() favorite?: boolean;
}

export class UpdateLearningFileDto {
  @IsOptional() @IsString() subjectId?: string | null;
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() kind?: string;
  @IsOptional() @IsNumber() size?: number;
  @IsOptional() @IsString() mime?: string;
  @IsOptional() @IsString() dataUrl?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) tags?: string[];
  @IsOptional() @IsBoolean() favorite?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsBoolean() trashed?: boolean;
}

// ---------- Tasks ----------

export class CreateLearningTaskDto {
  @IsOptional() @IsString() id?: string;
  @IsOptional() @IsString() subjectId?: string | null;
  @IsString() title: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() deadline?: number | null;
  @IsOptional() @IsNumber() reminderAt?: number | null;
  @IsOptional() @IsIn(['low', 'medium', 'high']) priority?: 'low' | 'medium' | 'high';
  @IsOptional() @IsBoolean() completed?: boolean;
}

export class UpdateLearningTaskDto {
  @IsOptional() @IsString() subjectId?: string | null;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsNumber() deadline?: number | null;
  @IsOptional() @IsNumber() reminderAt?: number | null;
  @IsOptional() @IsIn(['low', 'medium', 'high']) priority?: 'low' | 'medium' | 'high';
  @IsOptional() @IsBoolean() completed?: boolean;
  @IsOptional() @IsBoolean() archived?: boolean;
  @IsOptional() @IsBoolean() trashed?: boolean;
}

// ---------- Bookmarks ----------

export class ToggleLearningBookmarkDto {
  @IsOptional() @IsString() id?: string;
  @IsIn(['note', 'lecture', 'file']) refType: 'note' | 'lecture' | 'file';
  @IsString() refId: string;
}

// ---------- Study Sessions ----------

export class TrackStudySessionDto {
  @IsNumber() minutes: number;
  @IsOptional() @IsString() date?: string;
}
