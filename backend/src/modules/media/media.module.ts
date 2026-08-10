import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ConfigModule } from '@nestjs/config';
import { UploadsController } from './media.controller';
import { UploadsService } from './media.service';

@Module({
  imports: [
    ConfigModule,
    MulterModule.register({}),
  ],
  controllers: [UploadsController],
  providers: [UploadsService],
  exports: [UploadsService],
})
export class MediaModule {}
