import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";

async function bootstrap() {
  // Tạo ứng dụng NestJS
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("AuthService");
  const configService = app.get(ConfigService);

  // Lấy cấu hình Kafka từ environment
  const kafkaBroker = configService.get<string>("KAFKA_BROKER");
  const brokers = kafkaBroker ? kafkaBroker.split(",") : ["localhost:9092"];

  // Kết nối đến Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "auth-service",
        brokers,
      },
      consumer: {
        groupId: "auth-service-group",
        allowAutoTopicCreation: true,
      },
    },
  });

  // Áp dụng validation pipe toàn cục
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Khởi động microservice
  await app.startAllMicroservices();

  // Khởi động HTTP server (nếu cần thiết)
  // const port = configService.get<number>("AUTH_SERVICE_PORT", 3003);
  // await app.listen(port);

  // logger.log(`Auth Microservice running on port ${port}`);
  logger.log("Auth Microservice connected to Kafka");
}

bootstrap();
