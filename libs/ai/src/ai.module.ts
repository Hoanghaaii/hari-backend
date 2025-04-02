import { Module, DynamicModule, Provider } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GeminiService } from './providers/gemini.service';
import { AiConfigOptions } from './interfaces/ai-config.interface';
import { AI_CONFIG, GEMINI_API_KEY } from './interfaces/ai.constants';

@Module({})
export class AiModule {
  /**
   * Đăng ký module với cấu hình
   */
  static forRoot(options: AiConfigOptions): DynamicModule {
    const aiConfigProvider: Provider = {
      provide: AI_CONFIG,
      useValue: options,
    };

    const apiKeyProvider: Provider = {
      provide: GEMINI_API_KEY,
      useValue: options.geminiApiKey,
    };

    return {
      module: AiModule,
      providers: [aiConfigProvider, apiKeyProvider, GeminiService],
      exports: [GeminiService],
      global: options.isGlobal,
    };
  }

  /**
   * Đăng ký module với cấu hình bất đồng bộ
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<AiConfigOptions> | AiConfigOptions;
    inject?: any[];
  }): DynamicModule {
    const aiConfigProvider: Provider = {
      provide: AI_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    const apiKeyProvider: Provider = {
      provide: GEMINI_API_KEY,
      useFactory: async (...args: any[]) => {
        const config = await options.useFactory(...args);
        return config.geminiApiKey;
      },
      inject: options.inject || [],
    };

    return {
      module: AiModule,
      imports: options.imports || [],
      providers: [aiConfigProvider, apiKeyProvider, GeminiService],
      exports: [GeminiService],
      global: true,
    };
  }
}
