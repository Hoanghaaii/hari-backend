import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_FILTER, APP_PIPE, APP_INTERCEPTOR } from '@nestjs/core';
import { AllExceptionsFilter, HttpExceptionFilter } from './filters';
import { ValidationPipe } from './pipes';
import { TransformResponseInterceptor } from './interceptors';
import { appConfig, validationConfig } from './config';

/**
 * Common module cung cấp các chức năng dùng chung cho toàn bộ ứng dụng
 * Module này được đánh dấu là Global nên chỉ cần import một lần ở root module
 */
@Global()
@Module({
  imports: [
    // Cấu hình ConfigModule với các cấu hình mặc định
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '.env.local'],
      load: [appConfig, validationConfig],
    }),
  ],
  providers: [
    // Global filters
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    // Global pipes
    {
      provide: APP_PIPE,
      useClass: ValidationPipe,
    },
    // Global interceptors
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformResponseInterceptor,
    },
  ],
  exports: [
    ConfigModule,
  ],
})
export class CommonModule {}
