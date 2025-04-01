import { CACHE_KEY_METADATA, CACHE_TTL_METADATA, NO_CACHE_METADATA } from '../decorators';
import { Injectable, ExecutionContext, CallHandler, NestInterceptor, Inject, Logger } from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Reflector } from '@nestjs/core';
import { Cache } from 'cache-manager';
import { Request } from 'express';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  private readonly logger = new Logger(CacheInterceptor.name);
  
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private reflector: Reflector,
  ) {}
  
  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<any>> {
    // Chỉ áp dụng cho HTTP requests
    if (context.getType() !== 'http') {
      return next.handle();
    }
    
    const request = context.switchToHttp().getRequest<Request>();
    
    // Không cache cho các phương thức non-GET
    if (request.method !== 'GET') {
      return next.handle();
    }
    
    // Kiểm tra nếu đã đánh dấu NoCache
    const noCache = this.reflector.getAllAndOverride<boolean>(NO_CACHE_METADATA, [
      context.getHandler(),
      context.getClass(),
    ]);
    
    if (noCache) {
      return next.handle();
    }
    
    // Lấy cache key từ metadata hoặc tạo từ URL
    const cacheKey = this.reflector.get<string>(CACHE_KEY_METADATA, context.getHandler()) || 
      `http-cache:${request.url}`;
    
    // Lấy TTL từ metadata
    const ttl = this.reflector.get<number>(CACHE_TTL_METADATA, context.getHandler());
    
    // Kiểm tra cache
    try {
      const cachedResponse = await this.cacheManager.get(cacheKey);
      
      if (cachedResponse) {
        return of(cachedResponse);
      }
      
      // Nếu không có trong cache, thực thi handler và cache kết quả
      return next.handle().pipe(
        tap(response => {
          try {
            // Sửa phần spread operator để tránh lỗi TypeScript
            if (ttl) {
              this.cacheManager.set(cacheKey, response, { ttl } as any);
            } else {
              this.cacheManager.set(cacheKey, response);
            }
          } catch (err) {
            this.logger.error(`Error setting cache: ${err.message}`, err.stack);
          }
        }),
      );
    } catch (err) {
      this.logger.error(`Error retrieving cache: ${err.message}`, err.stack);
      return next.handle();
    }
  }
}
