import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { TransformResponseInterceptor } from "@app/common";
import * as compression from "compression";
import * as cookieParser from "cookie-parser";
import helmet from "helmet";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);

  // Middleware
  app.use(helmet());
  app.use(compression());
  app.use(cookieParser());

  // Global prefix
  app.setGlobalPrefix("api");

  // Cors
  app.enableCors({
    origin: configService.get<string>("app.frontendUrl"),
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    })
  );

  // Global interceptors
  app.useGlobalInterceptors(new TransformResponseInterceptor());

  // Start server
  const port = configService.get<number>("app.port") || 3000;
  await app.listen(port);
  console.log(`API Gateway is running on: ${await app.getUrl()}`);
}
bootstrap();
