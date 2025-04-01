import { Module, DynamicModule, Global } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongoConfig } from './interfaces/mongo-config.interface';
import { MongoDatabaseService } from './mongo/mongo-database.service';

@Global()
@Module({})
export class DatabaseModule {
  /**
   * Đăng ký module với kết nối MongoDB
   */
  static forRoot(options?: MongoConfig): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          useFactory: (configService: ConfigService) => ({
            uri: options?.uri || configService.get<string>('MONGODB_URI'),
            ...options?.mongooseOptions,
          }),
          inject: [ConfigService],
        }),
      ],
      providers: [
        MongoDatabaseService,
      ],
      exports: [
        MongoDatabaseService,
        MongooseModule,
      ],
    };
  }

  /**
   * Đăng ký module với kết nối tới MongoDB (async)
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<MongoConfig> | MongoConfig;
    inject?: any[];
  }): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forRootAsync({
          imports: options.imports || [],
          useFactory: async (...args) => {
            const config = await options.useFactory(...args);
            return {
              uri: config.uri,
              ...config.mongooseOptions,
            };
          },
          inject: options.inject || [],
        }),
      ],
      providers: [
        MongoDatabaseService,
      ],
      exports: [
        MongoDatabaseService,
        MongooseModule,
      ],
    };
  }

  /**
   * Đăng ký module với kết nối tới feature (entity)
   */
  static forFeature(models: any[]): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        MongooseModule.forFeature(models),
      ],
      exports: [
        MongooseModule.forFeature(models),
      ],
    };
  }
}
