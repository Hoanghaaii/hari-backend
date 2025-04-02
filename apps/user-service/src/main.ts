import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { Logger, ValidationPipe } from "@nestjs/common";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { ConfigService } from "@nestjs/config";
import { KafkaGroupId } from "@app/kafka/constants";

async function bootstrap() {
  // Tạo ứng dụng NestJS
  const app = await NestFactory.create(AppModule);
  const logger = new Logger("UserService");
  const configService = app.get(ConfigService);

  // Lấy cấu hình Kafka từ environment
  const kafkaBroker = configService.get<string>("KAFKA_BROKER");
  const brokers = kafkaBroker ? kafkaBroker.split(",") : ["localhost:9092"];

  // Kết nối đến Kafka microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        clientId: "user-service",
        brokers,
      },
      consumer: {
        groupId: KafkaGroupId.USER_SERVICE,
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
  // const port = configService.get<number>('USER_SERVICE_PORT', 3001);
  // await app.listen(port);
  // logger.log(`User Service running on port ${port}`);

  logger.log("User Microservice connected to Kafka");
}

bootstrap();
