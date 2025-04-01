import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit {
  private readonly logger = new Logger(RedisService.name);
  private redisClient: Redis;

  constructor(private readonly configService: ConfigService) {
    this.redisClient = new Redis({
      host: this.configService.get<string>('REDIS_HOST', 'localhost'),
      port: this.configService.get<number>('REDIS_PORT', 6379),
      password: this.configService.get<string>('REDIS_PASSWORD', ''),
      db: this.configService.get<number>('REDIS_DB', 0),
      keyPrefix: this.configService.get<string>('REDIS_PREFIX', ''),
    });
    
    // Xử lý sự kiện kết nối Redis
    this.redisClient.on('connect', () => {
      this.logger.log('Redis connected successfully');
    });
    
    this.redisClient.on('error', (error) => {
      this.logger.error(`Redis connection error: ${error.message}`);
    });
  }

  async onModuleInit() {
    try {
      const pong = await this.redisClient.ping();
      if (pong === 'PONG') {
        this.logger.log('Redis ping: PONG');
      }
    } catch (error) {
      this.logger.error(`Redis ping failed: ${error.message}`);
    }
  }

  /**
   * Lấy Redis client
   */
  getClient(): Redis {
    return this.redisClient;
  }

  /**
   * Set key với giá trị và TTL (seconds)
   */
  async set(key: string, value: string | number | Buffer | object, ttl?: number): Promise<string> {
    try {
      const serializedValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
      
      if (ttl) {
        return await this.redisClient.set(key, serializedValue, 'EX', ttl);
      }
      
      return await this.redisClient.set(key, serializedValue);
    } catch (error) {
      this.logger.error(`Redis SET error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lấy giá trị theo key
   */
  async get<T = string>(key: string, parse = false): Promise<T | null> {
    try {
      const value = await this.redisClient.get(key);
      
      if (!value) return null;
      
      if (parse) {
        try {
          return JSON.parse(value) as T;
        } catch (e) {
          // Nếu không parse được JSON, trả về giá trị gốc
          return value as unknown as T;
        }
      }
      
      return value as unknown as T;
    } catch (error) {
      this.logger.error(`Redis GET error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Xóa key
   */
  async del(...keys: string[]): Promise<number> {
    try {
      return await this.redisClient.del(keys);
    } catch (error) {
      this.logger.error(`Redis DEL error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Kiểm tra key có tồn tại không
   */
  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXISTS error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Thiết lập thời gian hết hạn cho key (seconds)
   */
  async expire(key: string, ttl: number): Promise<boolean> {
    try {
      const result = await this.redisClient.expire(key, ttl);
      return result === 1;
    } catch (error) {
      this.logger.error(`Redis EXPIRE error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tăng giá trị của key lên 1
   */
  async incr(key: string): Promise<number> {
    try {
      return await this.redisClient.incr(key);
    } catch (error) {
      this.logger.error(`Redis INCR error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Tăng giá trị của key lên một số
   */
  async incrBy(key: string, increment: number): Promise<number> {
    try {
      return await this.redisClient.incrby(key, increment);
    } catch (error) {
      this.logger.error(`Redis INCRBY error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Giảm giá trị của key đi 1
   */
  async decr(key: string): Promise<number> {
    try {
      return await this.redisClient.decr(key);
    } catch (error) {
      this.logger.error(`Redis DECR error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Giảm giá trị của key đi một số
   */
  async decrBy(key: string, decrement: number): Promise<number> {
    try {
      return await this.redisClient.decrby(key, decrement);
    } catch (error) {
      this.logger.error(`Redis DECRBY error: ${error.message}`);
      throw error;
    }
  }
}
