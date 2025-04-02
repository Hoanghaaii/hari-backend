import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from '@app/common';
import { DatabaseModule } from '@app/database';
import { CacheModule } from '@app/cache';
import { KafkaModule } from '@app/kafka';
import { RbacModule } from '@app/rbac';
import { GatewayController } from './gateway.controller';
import { GatewayService } from './gateway.service';
import appConfig from './config/app.config';
import { KafkaGroupId } from '@app/kafka/constants';
import { UserRole } from '@app/common/enums';
import { JWT_CONSTANTS } from '@app/common/constants';

@Module({
  imports: [
    // Config module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env', '.env.local'],
    }),
    
    // Common module
    CommonModule,
    
    // Database
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI', 'mongodb://localhost:27017/hari'),
      }),
      inject: [ConfigService],
    }),
    
    // Cache
    CacheModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: 60, // 1 minute
        isGlobal: true,
        useRedis: false, // Đổi thành false để sử dụng memory cache trong quá trình phát triển
      }),
      inject: [ConfigService],
    }),
    
    // Kafka
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        // Xử lý trường hợp không có biến môi trường KAFKA_BROKER
        const kafkaBroker = configService.get<string>('KAFKA_BROKER');
        const brokers = kafkaBroker ? kafkaBroker.split(',') : ['localhost:9092'];
        
        return {
          clientId: 'api-gateway',
          brokers: brokers,
          groupId: KafkaGroupId.API_GATEWAY,
          allowAutoTopicCreation: true,
        };
      },
      inject: [ConfigService],
    }),
    
    // RBAC
    RbacModule.forRoot({
      roles: Object.values(UserRole),
      superRole: UserRole.SUPER_ADMIN,
    }),
    
    // JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET', JWT_CONSTANTS.ACCESS_TOKEN_SECRET),
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN', JWT_CONSTANTS.ACCESS_TOKEN_EXPIRATION),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [GatewayController],
  providers: [GatewayService],
})
export class AppModule {}
