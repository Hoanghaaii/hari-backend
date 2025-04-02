/**
 * Interface cho AI config options
 */
export interface AiConfigOptions {
  geminiApiKey: string;
  defaultModel?: string;
  isGlobal?: boolean;
  maxTokens?: number;
  temperature?: number;
  topP?: number;
  topK?: number;
}

/**
 * Interface cho chat message
 */
export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

/**
 * Interface cho chat options
 */
export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  topK?: number;
  stopSequences?: string[];
  safetySettings?: any[];
}

/**
 * Interface cho text generation options
 */
export interface TextGenerationOptions extends ChatOptions {
  prompt: string;
}

/**
 * Interface cho AI response
 */
export interface AiResponse {
  text: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  finishReason?: string;
  model?: string;
}
