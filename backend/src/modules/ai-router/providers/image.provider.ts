import { Injectable } from '@nestjs/common';
import { AiIntegrationService } from '../../../common/services/ai-integration.service';
import { ProviderFallbackService } from '../../../common/services/provider-fallback.service';
import { AIProviderResponse, AIImageOptions } from './ai-provider.interface';

@Injectable()
export class ImageProvider {
  constructor(
    private ai: AiIntegrationService,
    private fallback: ProviderFallbackService,
  ) {}

  async generate(options: AIImageOptions): Promise<AIProviderResponse> {
    const start = Date.now();

    try {
      const { data: imageUrl, provider } = await this.fallback.tryProviders(
        this.fallback.getImageProviders(),
        {
          fal: () => this.ai.falImage(options.prompt),
          stability: () => this.ai.stabilityImage(options.prompt),
          pollinations: () => this.ai.pollinationsImage(options.prompt),
        },
      );

      let modelName = '';
      switch (provider) {
        case 'fal': modelName = 'fal-ai/flux/dev'; break;
        case 'stability': modelName = 'sd3-large'; break;
        case 'pollinations': modelName = 'pollinations-flux'; break;
      }

      return {
        success: true,
        data: {
          url: imageUrl || `https://placehold.co/1024x1024/1a1a2e/e0e0e0?text=${encodeURIComponent(options.prompt.slice(0, 40))}`,
          prompt: options.prompt,
          style: options.style || 'photorealistic',
          width: options.width || 1024,
          height: options.height || 1024,
          isReal: !!imageUrl,
        },
        model: modelName,
        provider,
        latency: Date.now() - start,
      };
    } catch {
      return {
        success: true,
        data: {
          url: `https://placehold.co/1024x1024/1a1a2e/e0e0e0?text=${encodeURIComponent(options.prompt.slice(0, 40))}`,
          prompt: options.prompt,
          style: options.style || 'photorealistic',
          width: options.width || 1024,
          height: options.height || 1024,
          isReal: false,
        },
        model: 'mock',
        provider: 'mock',
        latency: Date.now() - start,
      };
    }
  }
}
