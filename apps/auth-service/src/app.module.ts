import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { ClientsModule, Transport } from "@nestjs/microservices";

import { CommonModule } from "@app/common";
import { DatabaseModule } from "@app/database";
import { KafkaModule } from "@app/kafka";
import { CacheModule } from "@app/cache";
import { RbacModule } from "@app/rbac";

import { JwtStrategy } from "./strategies/jwt.strategy";
import { KAFKA_CLIENT } from "@app/kafka/constants";
import appConfig from "./config/app.config";
import { JWT_CONSTANTS } from "@app/common/constants";
import { RefreshTokenSchema } from "./schemas/refresh-token.schema";
import { AuthController } from "./controllers";
import { AuthService, TokenService } from "./services";

@Module({
  imports: [
    // Modules từ libs
    CommonModule,
    DatabaseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>(
          "MONGODB_URI",
          "mongodb://localhost:27017/hari"
        ),
      }),
      inject: [ConfigService],
    }),
    KafkaModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const kafkaBroker = configService.get<string>("KAFKA_BROKER");
        const brokers = kafkaBroker
          ? kafkaBroker.split(",")
          : ["localhost:9092"];

        return {
          clientId: "auth-service",
          brokers,
          groupId: "auth-service-group",
          allowAutoTopicCreation: true,
        };
      },
      inject: [ConfigService],
    }),
    CacheModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        ttl: 60 * 60, // 1 hour
        isGlobal: true,
        useRedis: true,
      }),
      inject: [ConfigService],
    }),
    RbacModule.forRoot(),

    // Config module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [".env", ".env.local"],
    }),

    // JWT Module
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>(
          "JWT_SECRET",
          JWT_CONSTANTS.ACCESS_TOKEN_SECRET
        ),
        signOptions: {
          expiresIn: configService.get<string>(
            "JWT_EXPIRES_IN",
            JWT_CONSTANTS.ACCESS_TOKEN_EXPIRATION
          ),
        },
      }),
      inject: [ConfigService],
    }),

    // MongoDB schema
    MongooseModule.forFeature([
      { name: "RefreshToken", schema: RefreshTokenSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, TokenService, JwtStrategy],
})
export class AppModule {}
