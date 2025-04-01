import { Module, DynamicModule, Global } from '@nestjs/common';
import { CacheModule as NestCacheModule } from '@nestjs/cache-manager';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as redisStore from 'cache-manager-ioredis';
import { RedisService } from '@app/database/redis';
import { CacheService } from './services/cache.service';
import { CacheInterceptor } from './interceptors/cache.interceptor';

export interface CacheModuleOptions {
  ttl?: number;
  max?: number;
  isGlobal?: boolean;
  useRedis?: boolean;
}

@Global()
@Module({})
export class CacheModule {
  /**
   * Đăng ký cache module với cấu hình
   */
  static forRoot(options: CacheModuleOptions = {}): DynamicModule {
    const { ttl = 60, max = 100, isGlobal = true, useRedis = false } = options;
    
    return {
      module: CacheModule,
      imports: [
        NestCacheModule.registerAsync({
          isGlobal,
          imports: [ConfigModule],
          useFactory: (configService: ConfigService) => {
            // Nếu sử dụng Redis làm cache store
            if (useRedis) {
              return {
                store: redisStore,
                host: configService.get<string>('REDIS_HOST', 'localhost'),
                port: configService.get<number>('REDIS_PORT', 6379),
                password: configService.get<string>('REDIS_PASSWORD', ''),
                db: configService.get<number>('REDIS_DB', 0),
                ttl,
                max,
              };
            }
            
            // Sử dụng in-memory cache
            return {
              ttl,
              max,
            };
          },
          inject: [ConfigService],
        }),
      ],
      providers: [
        CacheService,
        CacheInterceptor,
      ],
      exports: [
        NestCacheModule,
        CacheService,
        CacheInterceptor,
      ],
    };
  }

  /**
   * Đăng ký cache module với cấu hình bất đồng bộ
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<CacheModuleOptions> | CacheModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: CacheModule,
      imports: [
        NestCacheModule.registerAsync({
          isGlobal: true,
          imports: [...(options.imports || []), ConfigModule],
          useFactory: async (...args) => {
            const { ttl = 60, max = 100, useRedis = false } = await options.useFactory(...args);
            const configService = args.find(arg => arg instanceof ConfigService);
            
            if (useRedis && configService) {
              return {
                store: redisStore,
                host: configService.get<string>('REDIS_HOST', 'localhost'),
                port: configService.get<number>('REDIS_PORT', 6379),
                password: configService.get<string>('REDIS_PASSWORD', ''),
                db: configService.get<number>('REDIS_DB', 0),
                ttl,
                max,
              };
            }
            
            return {
              ttl,
              max,
            };
          },
          inject: [...(options.inject || []), ConfigService],
        }),
      ],
      providers: [
        CacheService,
        CacheInterceptor,
      ],
      exports: [
        NestCacheModule,
        CacheService,
        CacheInterceptor,
      ],
    };
  }
}
