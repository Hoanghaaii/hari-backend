import { IsString, IsNotEmpty, IsOptional, IsNumber, IsArray, Min, Max, IsEnum } from 'class-validator';
import { GEMINI_PRO } from '../interfaces/ai.constants';

/**
 * DTO cho chat completion request
 */
export class ChatCompletionRequestDto {
  @IsArray()
  @IsNotEmpty()
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
  }>;

  @IsString()
  @IsOptional()
  model?: string = GEMINI_PRO;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  topP?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  topK?: number;

  @IsArray()
  @IsOptional()
  stopSequences?: string[];
}

/**
 * DTO cho text generation request
 */
export class TextGenerationRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsOptional()
  model?: string = GEMINI_PRO;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  temperature?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  maxTokens?: number;

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1)
  topP?: number;

  @IsNumber()
  @IsOptional()
  @Min(1)
  topK?: number;

  @IsArray()
  @IsOptional()
  stopSequences?: string[];
}
