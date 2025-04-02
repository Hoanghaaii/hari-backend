import { Injectable, Inject, Logger, OnModuleInit } from '@nestjs/common';
import { GoogleGenerativeAI, GenerationConfig, HarmCategory, HarmBlockThreshold } from '@google/generative-ai';
import { GEMINI_API_KEY, GEMINI_PRO } from '../interfaces/ai.constants';
import { 
  AiConfigOptions, 
  ChatMessage, 
  ChatOptions, 
  TextGenerationOptions, 
  AiResponse 
} from '../interfaces/ai-config.interface';
import { ChatCompletionRequestDto, TextGenerationRequestDto } from '../dto/ai-request.dto';

@Injectable()
export class GeminiService implements OnModuleInit {
  private readonly logger = new Logger(GeminiService.name);
  private genAI: GoogleGenerativeAI;
  private defaultModel: string;
  private defaultConfig: GenerationConfig;

  constructor(
    @Inject(GEMINI_API_KEY) private readonly apiKey: string,
  ) {}

  async onModuleInit() {
    try {
      this.logger.log('Initializing Gemini AI service...');
      this.genAI = new GoogleGenerativeAI(this.apiKey);
      this.defaultModel = GEMINI_PRO;
      this.defaultConfig = {
        temperature: 0.7,
        topP: 0.95,
        topK: 40,
      };
      
      // Kiểm tra kết nối
      const model = this.genAI.getGenerativeModel({ model: this.defaultModel });
      await model.countTokens('Hello, world!');
      
      this.logger.log('Gemini AI service initialized successfully');
    } catch (error) {
      this.logger.error(`Failed to initialize Gemini AI service: ${error.message}`, error.stack);
    }
  }

  /**
   * Generate text từ prompt
   */
  async generateText(options: TextGenerationOptions): Promise<AiResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: options.model || this.defaultModel,
      });
      
      // Generation config
      const generationConfig: GenerationConfig = {
        temperature: options.temperature ?? this.defaultConfig.temperature,
        topP: options.topP ?? this.defaultConfig.topP,
        topK: options.topK ?? this.defaultConfig.topK,
        maxOutputTokens: options.maxTokens,
        stopSequences: options.stopSequences,
      };
      
      // Tính tokens cho prompt
      const promptTokens = await model.countTokens(options.prompt);
      
      // Gọi API
      const result = await model.generateContent(options.prompt, {
        generationConfig,
      });
      
      const response = result.response;
      const text = response.text();
      
      // Chuyển đổi response
      return {
        text,
        model: options.model || this.defaultModel,
        usage: {
          promptTokens: promptTokens.totalTokens,
          completionTokens: -1, // Gemini không trả về completion tokens
          totalTokens: promptTokens.totalTokens, // Không chính xác hoàn toàn
        },
        finishReason: response.promptFeedback?.blockReason || 'STOP',
      };
    } catch (error) {
      this.logger.error(`Error generating text: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate chat completion
   */
  async generateChatCompletion(messages: ChatMessage[], options: ChatOptions = {}): Promise<AiResponse> {
    try {
      const model = this.genAI.getGenerativeModel({
        model: options.model || this.defaultModel,
      });
      
      // Generation config
      const generationConfig: GenerationConfig = {
        temperature: options.temperature ?? this.defaultConfig.temperature,
        topP: options.topP ?? this.defaultConfig.topP,
        topK: options.topK ?? this.defaultConfig.topK,
        maxOutputTokens: options.maxTokens,
        stopSequences: options.stopSequences,
      };
      
      // Chuyển đổi messages sang định dạng của Gemini chat
      const chat = model.startChat();
      
      // Theo dõi prompts để đếm tokens
      let allPrompts = '';
      
      // Xử lý các messages
      const history = [];
      for (const message of messages) {
        if (message.role === 'system') {
          // Thêm system message làm context đầu tiên
          allPrompts += message.content + '\n';
          // Không cần thêm system message vào lịch sử
        } else if (message.role === 'user' || message.role === 'assistant') {
          history.push({
            role: message.role,
            parts: [{ text: message.content }],
          });
          allPrompts += message.content + '\n';
        }
      }
      
      // Extract last user message and previous history
      const lastUserMessage = history.filter(m => m.role === 'user').pop();
      const previousHistory = history.filter(m => m !== lastUserMessage);
      
      // Tính tokens cho tất cả prompts
      const promptTokens = await model.countTokens(allPrompts);
      
      // Nếu có previous history, thiết lập lại chat history
      if (previousHistory.length > 0) {
        chat.history = previousHistory;
      }
      
      // Gửi message cuối cùng của user
      const result = await chat.sendMessage(lastUserMessage?.parts[0].text || "", {
        generationConfig,
      });
      
      const text = result.response.text();
      
      // Chuyển đổi response
      return {
        text,
        model: options.model || this.defaultModel,
        usage: {
          promptTokens: promptTokens.totalTokens,
          completionTokens: -1, // Gemini không trả về completion tokens
          totalTokens: promptTokens.totalTokens, // Không chính xác hoàn toàn
        },
        finishReason: result.response.promptFeedback?.blockReason || 'STOP',
      };
    } catch (error) {
      this.logger.error(`Error generating chat completion: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate chat completion từ DTO
   */
  async chatCompletion(dto: ChatCompletionRequestDto): Promise<AiResponse> {
    return this.generateChatCompletion(dto.messages, {
      model: dto.model,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      topP: dto.topP,
      topK: dto.topK,
      stopSequences: dto.stopSequences,
    });
  }

  /**
   * Generate text từ DTO
   */
  async textGeneration(dto: TextGenerationRequestDto): Promise<AiResponse> {
    return this.generateText({
      prompt: dto.prompt,
      model: dto.model,
      temperature: dto.temperature,
      maxTokens: dto.maxTokens,
      topP: dto.topP,
      topK: dto.topK,
      stopSequences: dto.stopSequences,
    });
  }
}
