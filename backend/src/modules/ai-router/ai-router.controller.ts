import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AiRouterService } from './ai-router.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';
import { AIChatMessage } from './providers/ai-provider.interface';

@ApiTags('AI Router')
@Controller('ai-router')
export class AiRouterController {
  constructor(private router: AiRouterService) {}

  @Get('info')
  @ApiOperation({ summary: 'Get AI Router info and available providers' })
  async getRouterInfo() {
    return this.router.getRouterInfo();
  }

  @Post('chat')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route to chat/text generation' })
  async chat(
    @Body() body: { messages: AIChatMessage[]; temperature?: number; maxTokens?: number },
    @CurrentUser('id') userId: string,
  ) {
    const result = await this.router.routeToChat(body.messages, body);
    return { success: true, data: result.data, model: result.model, provider: result.provider };
  }

  @Post('image')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route to image generation' })
  async image(@Body() body: { prompt: string; style?: string; width?: number; height?: number; negativePrompt?: string }) {
    const result = await this.router.routeToImage(body);
    return { success: true, data: result.data, model: result.model, provider: result.provider };
  }

  @Post('code')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route to code generation' })
  async code(@Body() body: { prompt: string; language?: string; framework?: string; task?: string }) {
    const result = await this.router.routeToCode({
      prompt: body.prompt,
      language: body.language || 'typescript',
      framework: body.framework,
      task: (body.task as any) || 'generate',
    });
    return { success: true, data: result.data, model: result.model, provider: result.provider };
  }

  @Post('translate')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route to translation' })
  async translate(@Body() body: { text: string; sourceLanguage?: string; targetLanguage: string }) {
    const result = await this.router.routeToTranslation(body);
    return { success: true, data: result.data, model: result.model, provider: result.provider };
  }

  @Get('translate/languages')
  @ApiOperation({ summary: 'Get supported translation languages' })
  async getLanguages() {
    return this.router.getSupportedLanguages();
  }

  @Get('translate/detect')
  @ApiOperation({ summary: 'Detect language of text' })
  async detectLanguage(@Query('text') text: string) {
    const result = await this.router.detectLanguage(text);
    return { success: true, data: result.data };
  }

  @Post('search')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route to deep search' })
  async search(@Body() body: { query: string; depth?: 'quick' | 'deep' | 'comprehensive'; sources?: string[] }) {
    const result = await this.router.routeToSearch(body);
    return { success: true, data: result.data, model: result.model, provider: result.provider };
  }

  @Post('auto')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Auto-detect intent and route to best provider' })
  async autoRoute(
    @Body() body: { input: string; type?: string },
    @CurrentUser('id') userId: string,
  ) {
    const type = body.type || this.detectIntent(body.input);
    let result: any;

    switch (type) {
      case 'code':
        result = await this.router.routeToCode({ prompt: body.input, task: 'generate' });
        break;
      case 'image':
        result = await this.router.routeToImage({ prompt: body.input });
        break;
      case 'translate':
        result = await this.router.routeToTranslation({ text: body.input, targetLanguage: 'en' });
        break;
      case 'search':
        result = await this.router.routeToSearch({ query: body.input, depth: 'deep' });
        break;
      default:
        result = await this.router.routeToChat([{ role: 'user', content: body.input }]);
    }

    return {
      success: true,
      routedTo: type,
      data: result.data,
      model: result.model,
      provider: result.provider,
    };
  }

  private detectIntent(input: string): string {
    const lower = input.toLowerCase();
    if (/\b(generate|write|create|build|implement|code|function|class|api)\b.*\b(code|function|component|script)\b/i.test(lower)) return 'code';
    if (/\b(draw|generate|create|make)\b.*\b(image|picture|photo|art|logo|design|illustration)\b/i.test(lower)) return 'image';
    if (/\b(translate|say.*in|how to say|meaning in|convert.*to)\b/i.test(lower)) return 'translate';
    if (/\b(search|find|research|look up|investigate|explore)\b/i.test(lower)) return 'search';
    return 'chat';
  }
}
