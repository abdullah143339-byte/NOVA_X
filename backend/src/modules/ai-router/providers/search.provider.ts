import { Injectable } from '@nestjs/common';
import { AiIntegrationService } from '../../../common/services/ai-integration.service';
import { ProviderFallbackService } from '../../../common/services/provider-fallback.service';
import { AIProviderResponse, AISearchOptions } from './ai-provider.interface';

@Injectable()
export class SearchProvider {
  constructor(
    private ai: AiIntegrationService,
    private fallback: ProviderFallbackService,
  ) {}

  async deepSearch(options: AISearchOptions): Promise<AIProviderResponse> {
    const start = Date.now();
    const hasSearch = !!(process.env['GOOGLE_SEARCH_API_KEY'] && process.env['GOOGLE_SEARCH_CX']);

    let summary: string;
    let provider = '';
    let modelName = '';

    try {
      const result = await this.fallback.tryProviders(
        this.fallback.getSearchProviders(),
        {
          gemini: () => this.ai.geminiDeepSearch(options.query),
          groq: () => this.ai.groqChat([
            { role: 'system', content: 'You are a research assistant. Provide a comprehensive, well-structured answer. Format with markdown.' },
            { role: 'user', content: options.query },
          ], 'llama-3.1-70b-versatile', 0.3),
          openrouter: () => this.ai.openRouterChat([
            { role: 'system', content: 'You are a research assistant. Provide a comprehensive, well-structured answer. Format with markdown.' },
            { role: 'user', content: options.query },
          ], 'mistralai/mistral-7b-instruct', 0.3),
          deepseek: () => this.ai.deepSeekChat([
            { role: 'system', content: 'You are a research assistant. Provide a comprehensive, well-structured answer. Format with markdown.' },
            { role: 'user', content: options.query },
          ], 'deepseek-chat', 0.3),
          mistral: () => this.ai.mistralChat([
            { role: 'system', content: 'You are a research assistant. Provide a comprehensive, well-structured answer. Format with markdown.' },
            { role: 'user', content: options.query },
          ], 'mistral-small-latest', 0.3),
        },
      );
      summary = result.data;
      provider = result.provider;
      modelName = provider === 'gemini' ? 'gemini-2.0-flash-exp' : provider === 'groq' ? 'llama-3.1-70b-versatile' : provider === 'openrouter' ? 'mistralai/mistral-7b-instruct' : provider === 'deepseek' ? 'deepseek-chat' : 'mistral-small-latest';
    } catch {
      summary = this.mockSummary(options.query);
      provider = 'mock';
      modelName = 'mock';
    }

    let results: any[] = [];
    if (hasSearch) {
      results = await this.ai.webSearch(options.query);
    } else {
      results = this.mockResults(options.query);
    }

    return {
      success: true,
      data: { query: options.query, depth: options.depth || 'quick', summary, results, totalResults: results.length },
      model: modelName,
      provider,
      latency: Date.now() - start,
    };
  }

  private mockResults(query: string) {
    return [
      { title: `${query} — Complete Guide`, snippet: `Everything you need to know about ${query}, from fundamentals to advanced concepts.`, relevance: 0.98, source: 'nova-kb' },
      { title: `${query} Best Practices`, snippet: `Industry-standard approaches and methodologies for ${query}.`, relevance: 0.92, source: 'web' },
      { title: `${query} vs Alternatives`, snippet: `A comprehensive comparison of ${query} with other popular options.`, relevance: 0.87, source: 'community' },
      { title: `${query} Getting Started`, snippet: `Beginner-friendly introduction to ${query} with practical examples.`, relevance: 0.83, source: 'official-docs' },
    ];
  }

  private mockSummary(query: string): string {
    return `## Research: ${query}

### Key Findings
1. **${query}** is a significant topic with broad applications
2. Multiple established approaches exist with specific trade-offs
3. The field continues to evolve with regular developments

### Recommended Resources
- **Official Documentation** — Best for accurate, up-to-date information
- **Community Tutorials** — Practical examples and real-world use cases
- **Academic Papers** — Deep theoretical foundations

> ⚡ **Pro Tip**: Start with official docs, then explore community examples for practical implementation.`;
  }
}
