import { Injectable, Logger } from '@nestjs/common';
import { ChatProvider } from './providers/chat.provider';
import { ImageProvider } from './providers/image.provider';
import { CodeProvider } from './providers/code.provider';
import { TranslationProvider } from './providers/translation.provider';
import { SearchProvider } from './providers/search.provider';
import {
  AIProviderResponse,
  AIChatOptions,
  AIImageOptions,
  AICodeOptions,
  AITranslationOptions,
  AISearchOptions,
  AIChatMessage,
} from './providers/ai-provider.interface';

@Injectable()
export class AiRouterService {
  private readonly logger = new Logger(AiRouterService.name);

  constructor(
    private chatProvider: ChatProvider,
    private imageProvider: ImageProvider,
    private codeProvider: CodeProvider,
    private translationProvider: TranslationProvider,
    private searchProvider: SearchProvider,
  ) {}

  async routeToChat(messages: AIChatMessage[], options?: Partial<AIChatOptions>): Promise<AIProviderResponse> {
    this.logger.log(`Routing chat request with ${messages.length} messages`);
    return this.chatProvider.generate({
      messages,
      temperature: options?.temperature ?? 0.7,
      maxTokens: options?.maxTokens ?? 2048,
      stream: options?.stream ?? false,
    });
  }

  async routeToImage(options: AIImageOptions): Promise<AIProviderResponse> {
    this.logger.log(`Routing image generation: "${options.prompt.slice(0, 50)}..."`);
    return this.imageProvider.generate(options);
  }

  async routeToCode(options: AICodeOptions): Promise<AIProviderResponse> {
    this.logger.log(`Routing code ${options.task}: "${options.prompt.slice(0, 50)}..."`);
    return this.codeProvider.generate(options);
  }

  async routeToTranslation(options: AITranslationOptions): Promise<AIProviderResponse> {
    this.logger.log(`Routing translation: ${options.sourceLanguage || 'auto'} → ${options.targetLanguage}`);
    return this.translationProvider.translate(options);
  }

  async detectLanguage(text: string): Promise<AIProviderResponse> {
    this.logger.log(`Detecting language for text`);
    const lang = await this.translationProvider.detectLanguage(text);
    return {
      success: true,
      data: { language: lang },
      model: 'nova-lingua-7b',
      provider: 'nova-translate',
    };
  }

  async getSupportedLanguages(): Promise<AIProviderResponse> {
    return this.translationProvider.getSupportedLanguages();
  }

  async routeToSearch(options: AISearchOptions): Promise<AIProviderResponse> {
    this.logger.log(`Routing deep search: "${options.query}" (${options.depth || 'quick'} depth)`);
    return this.searchProvider.deepSearch(options);
  }

  async getRouterInfo(): Promise<AIProviderResponse> {
    return {
      success: true,
      data: {
        providers: [
          { id: 'chat', name: 'NOVA Chat', model: 'nova-chat-7b', capabilities: ['text-generation', 'qa', 'analysis', 'creative-writing'] },
          { id: 'code', name: 'NOVA Code', model: 'nova-code-7b', capabilities: ['code-generation', 'code-review', 'debugging', 'refactoring'] },
          { id: 'image', name: 'NOVA Vision', model: 'nova-image-xl', capabilities: ['image-generation', 'image-editing'] },
          { id: 'audio', name: 'NOVA Audio', model: 'nova-speech-3b', capabilities: ['text-to-speech', 'speech-to-text'] },
          { id: 'translation', name: 'NOVA Lingua', model: 'nova-lingua-7b', capabilities: ['translation', 'language-detection'] },
          { id: 'search', name: 'NOVA DeepSearch', model: 'nova-deepsearch-7b', capabilities: ['web-search', 'deep-research', 'knowledge-retrieval'] },
        ],
        routingStrategy: 'intent-based',
        autoScaling: true,
        fallbackEnabled: true,
      },
      model: 'nova-router',
      provider: 'nova-ai-os',
    };
  }
}
