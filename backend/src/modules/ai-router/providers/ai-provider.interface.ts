export interface AIProviderResponse {
  success: boolean;
  data: any;
  model: string;
  provider: string;
  latency?: number;
  tokensUsed?: number;
}

export interface AIChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface AIChatOptions {
  messages: AIChatMessage[];
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface AIImageOptions {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numImages?: number;
  style?: string;
}

export interface AICodeOptions {
  prompt: string;
  language?: string;
  framework?: string;
  task: 'generate' | 'review' | 'debug' | 'explain' | 'refactor';
}

export interface AIAudioOptions {
  text: string;
  voice?: string;
  speed?: number;
  format?: 'mp3' | 'wav' | 'ogg';
}

export interface AITranslationOptions {
  text: string;
  sourceLanguage?: string;
  targetLanguage: string;
}

export interface AISearchOptions {
  query: string;
  depth?: 'quick' | 'deep' | 'comprehensive';
  sources?: string[];
}
