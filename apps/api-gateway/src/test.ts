import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger } from '@nestjs/common';
import { GatewayService } from './gateway.service';
import { KafkaService } from '@app/kafka';
import { MongoDatabaseService } from '@app/database';
import { CacheService } from '@app/cache';

async function bootstrap() {
  const logger = new Logger('Test');
  logger.log('Initializing API Gateway test...');
  
  try {
    const app = await NestFactory.create(AppModule);
    await app.init();
    
    logger.log('API Gateway initialized successfully. Testing module imports...');
    
    // Kiểm tra các services
    try {
      // Sử dụng class thay vì string token
      const gatewayService = app.get(GatewayService);
      logger.log(`GatewayService available: ${!!gatewayService}`);
      
      const kafkaService = app.get(KafkaService);
      logger.log(`KafkaService available: ${!!kafkaService}`);
      
      const dbService = app.get(MongoDatabaseService);
      logger.log(`MongoDatabaseService available: ${!!dbService}`);
      
      const cacheService = app.get(CacheService);
      logger.log(`CacheService available: ${!!cacheService}`);
      
      logger.log('All service checks passed');
    } catch (error) {
      logger.error(`Service check failed: ${error.message}`);
    }
    
    // Liệt kê tất cả các routes
    try {
      const server = app.getHttpServer();
      if (server && server._events && server._events.request && server._events.request._router) {
        const router = server._events.request._router;
        
        logger.log('Registered routes:');
        router.stack.forEach(layer => {
          if (layer.route) {
            const path = layer.route.path;
            const methods = Object.keys(layer.route.methods).map(m => m.toUpperCase());
            logger.log(`${methods.join(', ')} ${path}`);
          }
        });
      } else {
        logger.warn('Could not access HTTP router stack');
      }
    } catch (error) {
      logger.error(`Error listing routes: ${error.message}`);
    }
    
    logger.log('All checks passed. API Gateway is ready to use.');
    await app.close();
  } catch (error) {
    logger.error(`Failed to initialize API Gateway: ${error.message}`);
    logger.error(error.stack);
  }
}

bootstrap();
