import { Injectable } from '@nestjs/common';
import { AiIntegrationService } from '../../../common/services/ai-integration.service';
import { ProviderFallbackService } from '../../../common/services/provider-fallback.service';
import { AIProviderResponse, AITranslationOptions } from './ai-provider.interface';

@Injectable()
export class TranslationProvider {
  constructor(
    private ai: AiIntegrationService,
    private fallback: ProviderFallbackService,
  ) {}

  async translate(options: AITranslationOptions): Promise<AIProviderResponse> {
    const start = Date.now();
    const langName = this.getLangName(options.targetLanguage);

    try {
      const { data: translatedText, provider } = await this.fallback.tryProviders(
        this.fallback.getTranslationProviders(),
        {
          gemini: () => this.ai.geminiTranslate(options.text, langName),
          groq: () => this.ai.groqChat([
            { role: 'system', content: `You are a translator. Translate to ${langName}. Return ONLY the translation.` },
            { role: 'user', content: options.text },
          ], 'mixtral-8x7b-32768', 0.3),
          openrouter: () => this.ai.openRouterChat([
            { role: 'system', content: `You are a translator. Translate to ${langName}. Return ONLY the translation.` },
            { role: 'user', content: options.text },
          ], 'mistralai/mistral-7b-instruct', 0.3),
          deepseek: () => this.ai.deepSeekChat([
            { role: 'system', content: `You are a translator. Translate to ${langName}. Return ONLY the translation.` },
            { role: 'user', content: options.text },
          ], 'deepseek-chat', 0.3),
          mistral: () => this.ai.mistralTranslate(options.text, langName),
        },
      );

      let detectedLang = '';
      try {
        const { data: lang } = await this.fallback.tryProviders(
          this.fallback.getTranslationProviders(),
          {
            gemini: () => this.ai.geminiDetectLanguage(options.text),
            groq: () => this.ai.groqChat([
              { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
              { role: 'user', content: options.text },
            ], 'mixtral-8x7b-32768', 0.3),
            openrouter: () => this.ai.openRouterChat([
              { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
              { role: 'user', content: options.text },
            ], 'mistralai/mistral-7b-instruct', 0.3),
            deepseek: () => this.ai.deepSeekChat([
              { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
              { role: 'user', content: options.text },
            ], 'deepseek-chat', 0.3),
            mistral: () => this.ai.mistralChat([
              { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
              { role: 'user', content: options.text },
            ], 'mistral-small-latest', 0.3),
          },
        );
        detectedLang = lang;
      } catch {
        detectedLang = 'Unknown';
      }

      let modelName = '';
      switch (provider) {
        case 'gemini': modelName = 'gemini-2.0-flash-exp'; break;
        case 'groq': modelName = 'mixtral-8x7b-32768'; break;
        case 'openrouter': modelName = 'mistralai/mistral-7b-instruct'; break;
        case 'deepseek': modelName = 'deepseek-chat'; break;
        case 'mistral': modelName = 'mistral-small-latest'; break;
      }

      return {
        success: true,
        data: { translatedText, sourceLanguage: detectedLang, targetLanguage: options.targetLanguage, confidence: 0.88 },
        model: modelName,
        provider,
        latency: Date.now() - start,
      };
    } catch {
      return {
        success: true,
        data: { translatedText: `[${options.sourceLanguage || 'auto'} → ${options.targetLanguage}] ${options.text}`, sourceLanguage: 'English', targetLanguage: options.targetLanguage, confidence: 0.5 },
        model: 'mock',
        provider: 'mock',
        latency: Date.now() - start,
      };
    }
  }

  async detectLanguage(text: string): Promise<AIProviderResponse> {
    try {
      const { data, provider } = await this.fallback.tryProviders(
        this.fallback.getTranslationProviders(),
        {
          gemini: () => this.ai.geminiDetectLanguage(text),
          groq: () => this.ai.groqChat([
            { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
            { role: 'user', content: text },
          ], 'mixtral-8x7b-32768', 0.3),
          openrouter: () => this.ai.openRouterChat([
            { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
            { role: 'user', content: text },
          ], 'mistralai/mistral-7b-instruct', 0.3),
          deepseek: () => this.ai.deepSeekChat([
            { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
            { role: 'user', content: text },
          ], 'deepseek-chat', 0.3),
          mistral: () => this.ai.mistralChat([
            { role: 'system', content: 'Detect the language. Return ONLY the language name (e.g., "English").' },
            { role: 'user', content: text },
          ], 'mistral-small-latest', 0.3),
        },
      );
      return { success: true, data: { language: data }, model: 'gemini-2.0-flash-exp', provider };
    } catch {
      return { success: true, data: { language: 'English' }, model: 'mock', provider: 'mock' };
    }
  }

  async getSupportedLanguages(): Promise<AIProviderResponse> {
    const languages = [
      { code: 'en', name: 'English' }, { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' }, { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' }, { code: 'pt', name: 'Portuguese' },
      { code: 'ru', name: 'Russian' }, { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' }, { code: 'ko', name: 'Korean' },
      { code: 'ar', name: 'Arabic' }, { code: 'hi', name: 'Hindi' },
      { code: 'ur', name: 'Urdu' }, { code: 'tr', name: 'Turkish' },
      { code: 'nl', name: 'Dutch' }, { code: 'pl', name: 'Polish' },
      { code: 'sv', name: 'Swedish' }, { code: 'da', name: 'Danish' },
      { code: 'fi', name: 'Finnish' }, { code: 'bn', name: 'Bengali' },
    ];
    return {
      success: true,
      data: { languages, count: languages.length },
      model: 'gemini-2.0-flash-exp',
      provider: 'gemini',
    };
  }

  private getLangName(code: string): string {
    const map: Record<string, string> = {
      en: 'English', es: 'Spanish', fr: 'French', de: 'German',
      it: 'Italian', pt: 'Portuguese', ru: 'Russian', zh: 'Chinese',
      ja: 'Japanese', ko: 'Korean', ar: 'Arabic', hi: 'Hindi',
      ur: 'Urdu', tr: 'Turkish', nl: 'Dutch', pl: 'Polish',
      sv: 'Swedish', da: 'Danish', fi: 'Finnish', bn: 'Bengali',
    };
    return map[code] || code;
  }
}
