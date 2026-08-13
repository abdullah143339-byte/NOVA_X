import { Injectable, ServiceUnavailableException } from '@nestjs/common';
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

    let imageUrl: string;
    let provider = '';
    try {
      const result = await this.fallback.tryProviders(
        this.fallback.getImageProviders(),
        {
          fal: () => this.ai.falImage(options.prompt),
          stability: () => this.ai.stabilityImage(options.prompt),
          pollinations: () => this.ai.pollinationsImage(options.prompt),
        },
      );
      imageUrl = result.data;
      provider = result.provider;
    } catch {
      throw new ServiceUnavailableException('AI image generation is unavailable: no AI provider is configured or reachable.');
    }

    if (!imageUrl) {
      throw new ServiceUnavailableException('AI image generation returned no result.');
    }

    let modelName = '';
    switch (provider) {
      case 'fal': modelName = 'fal-ai/flux/dev'; break;
      case 'stability': modelName = 'sd3-large'; break;
      case 'pollinations': modelName = 'pollinations-flux'; break;
    }

    return {
      success: true,
      data: {
        url: imageUrl,
        prompt: options.prompt,
        style: options.style || 'photorealistic',
        width: options.width || 1024,
        height: options.height || 1024,
        isReal: true,
      },
      model: modelName,
      provider,
      latency: Date.now() - start,
    };
  }
}
