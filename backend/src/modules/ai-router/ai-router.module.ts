import { Module } from '@nestjs/common';
import { AiRouterController } from './ai-router.controller';
import { AiRouterService } from './ai-router.service';
import { ChatProvider } from './providers/chat.provider';
import { ImageProvider } from './providers/image.provider';
import { CodeProvider } from './providers/code.provider';
import { TranslationProvider } from './providers/translation.provider';
import { SearchProvider } from './providers/search.provider';

@Module({
  controllers: [AiRouterController],
  providers: [
    AiRouterService,
    ChatProvider,
    ImageProvider,
    CodeProvider,
    TranslationProvider,
    SearchProvider,
  ],
  exports: [AiRouterService],
})
export class AiRouterModule {}
