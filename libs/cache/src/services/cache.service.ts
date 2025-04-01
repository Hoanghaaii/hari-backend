import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  private readonly logger = new Logger(CacheService.name);
  private readonly prefix: string = 'cache:';

  constructor(
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
  ) {}

  /**
   * Tạo khóa cache từ key
   */
  private createKey(key: string): string {
    return `${this.prefix}${key}`;
  }

  /**
   * Lưu giá trị vào cache
   */
  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    try {
      await this.cacheManager.set(this.createKey(key), value, ttl);
    } catch (error) {
      this.logger.error(`Error setting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Lấy giá trị từ cache
   */
  async get<T>(key: string): Promise<T | undefined> {
    try {
      return await this.cacheManager.get<T>(this.createKey(key));
    } catch (error) {
      this.logger.error(`Error getting cache key ${key}: ${error.message}`);
      return undefined;
    }
  }

  /**
   * Xóa giá trị khỏi cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(this.createKey(key));
    } catch (error) {
      this.logger.error(`Error deleting cache key ${key}: ${error.message}`);
    }
  }

  /**
   * Xóa nhiều key khỏi cache
   */
  async deleteMany(keys: string[]): Promise<void> {
    try {
      await Promise.all(keys.map(key => this.delete(key)));
    } catch (error) {
      this.logger.error(`Error deleting multiple cache keys: ${error.message}`);
    }
  }

  /**
   * Reset toàn bộ cache
   */
  async reset(): Promise<void> {
    try {
      await this.cacheManager.reset();
    } catch (error) {
      this.logger.error(`Error resetting cache: ${error.message}`);
    }
  }

  /**
   * Lấy giá trị từ cache, nếu không có thì gọi factory và lưu kết quả
   */
  async getOrSet<T>(key: string, factory: () => Promise<T>, ttl?: number): Promise<T> {
    const cachedValue = await this.get<T>(key);
    
    if (cachedValue !== undefined) {
      return cachedValue;
    }
    
    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Xóa cache theo pattern
   */
  async deleteByPattern(pattern: string): Promise<void> {
    try {
      // Cách thực hiện sẽ phụ thuộc vào store được sử dụng
      // Đối với memory store, chúng ta không thể xóa theo pattern
      // Đối với Redis, có thể cần truy cập trực tiếp client
      this.logger.warn(`deleteByPattern is not fully implemented for all cache stores`);
    } catch (error) {
      this.logger.error(`Error deleting cache by pattern ${pattern}: ${error.message}`);
    }
  }
}
