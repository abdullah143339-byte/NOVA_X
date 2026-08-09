import { Injectable } from '@nestjs/common';
import { AiIntegrationService } from '../../../common/services/ai-integration.service';
import { ProviderFallbackService } from '../../../common/services/provider-fallback.service';
import { AIProviderResponse, AIChatOptions } from './ai-provider.interface';

@Injectable()
export class ChatProvider {
  constructor(
    private ai: AiIntegrationService,
    private fallback: ProviderFallbackService,
  ) {}

  async generate(options: AIChatOptions): Promise<AIProviderResponse> {
    const start = Date.now();
    const messages = options.messages.map(m => ({ role: m.role, content: m.content }));
    const temp = options.temperature ?? 0.7;

    try {
      const { data, provider } = await this.fallback.tryProviders(
        this.fallback.getChatProviders(),
        {
          groq: () => this.ai.groqChat(messages, 'mixtral-8x7b-32768', temp),
          gemini: () => this.ai.geminiGenerate(messages.map(m => m.content).join('\n'), 'gemini-2.0-flash-exp'),
          openrouter: () => this.ai.openRouterChat(messages, 'mistralai/mistral-7b-instruct', temp),
          deepseek: () => this.ai.deepSeekChat(messages, 'deepseek-chat', temp),
          mistral: () => this.ai.mistralChat(messages, 'mistral-small-latest', temp),
        },
      );

      let modelName = '';
      switch (provider) {
        case 'groq': modelName = 'mixtral-8x7b-32768'; break;
        case 'gemini': modelName = 'gemini-2.0-flash-exp'; break;
        case 'openrouter': modelName = 'mistralai/mistral-7b-instruct'; break;
        case 'deepseek': modelName = 'deepseek-chat'; break;
        case 'mistral': modelName = 'mistral-small-latest'; break;
      }

      return {
        success: true,
        data: { content: data, role: 'assistant' },
        model: modelName,
        provider,
        latency: Date.now() - start,
      };
    } catch (err: any) {
      return {
        success: false,
        data: { content: this.mockResponse(options.messages[options.messages.length - 1]?.content || ''), role: 'assistant' },
        model: 'mock',
        provider: 'mock',
        latency: Date.now() - start,
      };
    }
  }

  private mockResponse(msg: string): string {
    const lower = msg.toLowerCase();
    if (/\b(explain|what is|how does|why|define|describe)\b/.test(lower))
      return `**Great question!**\n\nLet me explain this clearly.\n\n${msg.replace(/.*?(explain|what is|how does|why|define|describe)\s+/i, '')} is an important concept. At its core, it works through a series of logical steps that transform input into meaningful output.\n\n**Key points:**\n- It follows established patterns that have been refined over time\n- The approach prioritizes clarity and reliability\n- Real-world applications demonstrate its practical value\n\nWant me to dive deeper into any specific aspect?`;
    if (/\b(hello|hi|hey)\b/.test(lower))
      return `Hello! I'm NOVA AI, your intelligent assistant. How can I help you today?\n\nI can help with coding, explanations, brainstorming, analysis, and more. Just ask!`;
    if (/\b(thank|thanks)\b/.test(lower))
      return `You're welcome! 😊 Is there anything else you'd like to know? I'm here to help.`;
    return `Here's my response to your query:\n\nThank you for your question. Based on what you've asked, here are some key considerations:\n\n1. **Context matters** — The best approach depends on your specific situation\n2. **Start simple** — Begin with a basic solution and iterate\n3. **Learn by doing** — Practical experience is the best teacher\n\nWould you like me to elaborate on any particular aspect?`;
  }
}
