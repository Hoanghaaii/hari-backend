import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import { CommonModule } from "@app/common";
import { DatabaseModule } from "@app/database";
import { KafkaModule } from "@app/kafka";
import { CacheModule } from "@app/cache";
import { RbacModule } from "@app/rbac";
import { KafkaGroupId } from "@app/kafka/constants";
import { User, UserSchema } from "./schemas/user.schema";
import { UserController } from "./controllers";
import { UserService } from "./services";
import appConfig from "./config/app.config";

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
          clientId: "user-service",
          brokers,
          groupId: KafkaGroupId.USER_SERVICE,
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

    // Config Module
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: [".env", ".env.local"],
    }),

    // MongoDB Schema
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class AppModule {}
