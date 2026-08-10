import {
  Controller, Post, Req, UseGuards, UseInterceptors,
  UploadedFile, BadRequestException, Body,
  ParseFilePipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Request } from 'express';
import { ApiTags, ApiBearerAuth, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { UploadsService } from './media.service';
import { ApiResponseDto } from '../../common/dto/api-response.dto';

const MAX_FILE_SIZE = 500 * 1024 * 1024;

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(
    private uploadsService: UploadsService,
    private configService: ConfigService,
  ) {}

  @Post('presign')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a presigned URL for direct video upload' })
  async presignUpload(@Body() body: { filename?: string; contentType?: string; folder?: string }) {
    const filename = (body.filename || '').trim();
    const contentType = (body.contentType || '').trim();
    if (!filename || !contentType) {
      throw new BadRequestException('filename and contentType are required');
    }
    const ext = extname(filename).toLowerCase();
    if (!ext) {
      throw new BadRequestException('filename must include an extension');
    }
    const result = await this.uploadsService.getPresignedUrl({
      filename,
      contentType,
      folder: body.folder || 'uploads',
    });
    return ApiResponseDto.ok(result, 'Presigned upload URL generated');
  }

  @Post('post-media')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'data', 'uploads'),
        filename: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, uniqueSuffix + extname(file.originalname));
        },
      }),
      limits: { fileSize: MAX_FILE_SIZE },
      fileFilter: (_req: Request, file: Express.Multer.File, cb: (error: Error | null, accept: boolean) => void) => {
        const mime = (file.mimetype || '').toLowerCase();
        const ext = extname(file.originalname || '').toLowerCase();
        const allowedExts = [
          '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif', '.avif', '.bmp', '.svg',
          '.mp4', '.webm', '.mov', '.m4v', '.mkv', '.3gp', '.avi',
          '.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac', '.opus',
          '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.md', '.json', '.zip', '.rar',
        ];
        const docMimes = [
          'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
          'text/plain', 'text/csv', 'text/markdown', 'application/json', 'application/zip', 'application/x-rar-compressed',
        ];
        const isAllowed =
          mime.startsWith('image/') ||
          mime.startsWith('video/') ||
          mime.startsWith('audio/') ||
          docMimes.includes(mime) ||
          allowedExts.includes(ext);
        if (isAllowed) {
          cb(null, true);
        } else {
          cb(new BadRequestException(`Unsupported file type: ${file.mimetype || 'unknown'}`), false);
        }
      },
    }),
  )
  async uploadPostMedia(
    @Req() req: Request,
    @CurrentUser('id') _userId: string,
    @UploadedFile(
      new ParseFilePipe({
        fileIsRequired: true,
      }),
    )
    file: Express.Multer.File,
    @Body('type') type: string,
    @Body('duration') duration?: string,
  ) {
    const ext = extname(file.originalname || '').toLowerCase();
    const extMimes: Record<string, string> = {
      '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.gif': 'image/gif',
      '.webp': 'image/webp', '.heic': 'image/heic', '.heif': 'image/heif', '.avif': 'image/avif',
      '.bmp': 'image/bmp', '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime',
      '.m4v': 'video/x-m4v', '.mkv': 'video/x-matroska', '.3gp': 'video/3gpp', '.avi': 'video/x-msvideo',
      '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.ogg': 'audio/ogg', '.m4a': 'audio/mp4',
      '.aac': 'audio/aac', '.flac': 'audio/flac', '.opus': 'audio/opus',
      '.pdf': 'application/pdf', '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.ppt': 'application/vnd.ms-powerpoint',
      '.pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      '.txt': 'text/plain', '.csv': 'text/csv', '.md': 'text/markdown',
      '.json': 'application/json', '.zip': 'application/zip', '.rar': 'application/x-rar-compressed',
    };
    const mime = (!file.mimetype || file.mimetype === 'application/octet-stream') && extMimes[ext]
      ? extMimes[ext]
      : (file.mimetype || '').toLowerCase();

    const isVideo = mime.startsWith('video/');
    const durationSec = duration ? parseInt(duration, 10) : 0;

    await this.uploadsService.validateMedia(mime, type, isVideo, durationSec);

    const uploaded = await this.uploadsService.uploadMedia(file, req);

    return ApiResponseDto.ok({
      url: uploaded.url,
      filename: file.filename,
      key: uploaded.key,
      mimetype: mime,
      size: file.size,
      duration: durationSec,
      mediaType: isVideo ? 'VIDEO' : 'IMAGE',
    }, 'File uploaded');
  }
}
