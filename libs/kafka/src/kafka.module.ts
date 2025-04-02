import { Module, DynamicModule, Global, Provider } from "@nestjs/common";
import { KafkaService } from "./services/kafka.service";
import { KafkaConfig } from "./interfaces/kafka-config.interface";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  ClientsModule,
  Transport,
  ClientProviderOptions,
} from "@nestjs/microservices";
import { KAFKA_CONFIG, KAFKA_CLIENT } from "./constants/kafka.constants";

@Global()
@Module({})
export class KafkaModule {
  /**
   * Đăng ký module với cấu hình tĩnh
   */
  static forRoot(
    config: KafkaConfig,
    clientName: string = KAFKA_CLIENT
  ): DynamicModule {
    const kafkaConfigProvider: Provider = {
      provide: KAFKA_CONFIG,
      useValue: config,
    };

    return {
      module: KafkaModule,
      imports: [
        ClientsModule.register([
          {
            name: clientName,
            transport: Transport.KAFKA,
            options: {
              client: {
                clientId: config.clientId,
                brokers: config.brokers,
                ...(config.ssl ? { ssl: config.ssl } : {}),
                ...(config.sasl ? { sasl: config.sasl } : {}),
              },
              consumer: {
                groupId: config.groupId,
                allowAutoTopicCreation: config.allowAutoTopicCreation,
                ...(config.consumeFromBeginning
                  ? { readUncommitted: true }
                  : {}),
              },
              producer: {
                allowAutoTopicCreation: config.allowAutoTopicCreation,
                idempotent: config.idempotent || false,
                ...(config.producerConfig || {}),
              },
              run: {
                autoCommit: config.autoCommit || true,
              },
            },
          },
        ]),
      ],
      providers: [kafkaConfigProvider, KafkaService],
      exports: [ClientsModule, KafkaService],
    };
  }

  /**
   * Đăng ký module với cấu hình bất đồng bộ
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<KafkaConfig> | KafkaConfig;
    inject?: any[];
    clientName?: string;
  }): DynamicModule {
    const clientName = options.clientName || KAFKA_CLIENT;

    const kafkaConfigProvider: Provider = {
      provide: KAFKA_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: KafkaModule,
      imports: [
        ...(options.imports || []),
        ClientsModule.registerAsync([
          {
            name: clientName,
            imports: [...(options.imports || []), ConfigModule],
            useFactory: async (...args) => {
              const config = await options.useFactory(...args);

              return {
                name: clientName,
                transport: Transport.KAFKA,
                options: {
                  client: {
                    clientId: config.clientId,
                    brokers: config.brokers,
                    ...(config.ssl ? { ssl: config.ssl } : {}),
                    ...(config.sasl ? { sasl: config.sasl } : {}),
                  },
                  consumer: {
                    groupId: config.groupId,
                    allowAutoTopicCreation: config.allowAutoTopicCreation,
                    ...(config.consumeFromBeginning
                      ? { readUncommitted: true }
                      : {}),
                  },
                  producer: {
                    allowAutoTopicCreation: config.allowAutoTopicCreation,
                    idempotent: config.idempotent || false,
                    ...(config.producerConfig || {}),
                  },
                  run: {
                    autoCommit: config.autoCommit || true,
                  },
                },
              };
            },
            inject: [...(options.inject || [])],
          },
        ]),
      ],
      providers: [kafkaConfigProvider, KafkaService],
      exports: [ClientsModule, KafkaService],
      global: true,
    };
  }
}
