import {
  Injectable,
  Inject,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from "@nestjs/common";
import { ClientKafka } from "@nestjs/microservices";
import { KAFKA_CLIENT, KAFKA_CONFIG } from "../constants/kafka.constants";
import {
  KafkaConfig,
  KafkaMessageOptions,
} from "../interfaces/kafka-config.interface";
import {
  KafkaPayload,
  KafkaResponse,
} from "../interfaces/kafka-payload.interface";
import { KafkaSerializer } from "../serialization/kafka-serializer";
import { lastValueFrom, Observable, timeout, TimeoutError } from "rxjs";
import { catchError, map } from "rxjs/operators";
import {
  ServiceTimeoutException,
  ServiceUnavailableException,
} from "@app/common/exceptions";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);
  private readonly serializer = new KafkaSerializer();
  private readonly defaultRequestTimeout = 30000; // 30 seconds
  private isConnected = false;

  constructor(
    @Inject(KAFKA_CONFIG) private readonly kafkaConfig: KafkaConfig,
    @Inject(KAFKA_CLIENT) private readonly client: ClientKafka
  ) {}

  /**
   * Kết nối đến Kafka khi module được khởi tạo
   */
  async onModuleInit() {
    this.logger.log("Initializing Kafka connection...");

    try {
      // Kết nối client
      await this.client.connect();
      this.isConnected = true;
      this.logger.log("Kafka client connected successfully");
    } catch (error) {
      this.isConnected = false;
      this.logger.error(
        `Failed to connect to Kafka: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Ngắt kết nối khi module bị hủy
   */
  async onModuleDestroy() {
    this.logger.log("Closing Kafka connection...");

    try {
      await this.client.close();
      this.isConnected = false;
      this.logger.log("Kafka client disconnected successfully");
    } catch (error) {
      this.logger.error(
        `Error closing Kafka connection: ${error.message}`,
        error.stack
      );
    }
  }

  /**
   * Gửi event đến một topic
   */
  async emit<T>(
    topic: string,
    message: T,
    options: KafkaMessageOptions = {}
  ): Promise<void> {
    if (!this.isConnected) {
      throw new ServiceUnavailableException("Kafka");
    }

    try {
      // Serialize message
      const serializedMessage = this.serializer.serialize(message, {
        type: "event",
      });

      // Gửi message
      await this.client
        .emit(topic, {
          key: options.key,
          headers: options.headers,
          value: serializedMessage,
          partition: options.partition,
          timestamp: options.timestamp,
        })
        .toPromise();

      this.logger.debug(`Message emitted to topic ${topic}`);
    } catch (error) {
      this.logger.error(
        `Error emitting message to topic ${topic}: ${error.message}`,
        error.stack
      );
      throw error;
    }
  }

  /**
   * Gửi request và đợi response
   */
  async send<TRequest, TResponse>(
    pattern: string,
    data: TRequest,
    options: {
      timeout?: number;
      correlationId?: string;
      headers?: Record<string, any>;
    } = {}
  ): Promise<TResponse> {
    if (!this.isConnected) {
      throw new ServiceUnavailableException("Kafka");
    }

    const correlationId =
      options.correlationId ||
      `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    const requestTimeout = options.timeout || this.defaultRequestTimeout;

    try {
      // Tạo payload với metadata
      const payload: KafkaPayload<TRequest> = {
        metadata: {
          id: `req-${Date.now()}`,
          timestamp: Date.now(),
          correlationId,
          source: process.env.SERVICE_NAME || "unknown",
          type: "request",
        },
        data,
      };

      // Gửi request và đợi response
      const response$ = this.client
        .send<KafkaResponse<TResponse>>(pattern, payload)
        .pipe(
          timeout(requestTimeout),
          map((response) => {
            // Kiểm tra nếu response là error
            if (response.status === "error" && response.error) {
              throw new Error(response.error.message || "Unknown error");
            }

            return response.data;
          }),
          catchError((error) => {
            // Xử lý timeout
            if (error instanceof TimeoutError) {
              throw new ServiceTimeoutException("Kafka", requestTimeout);
            }

            throw error;
          })
        );

      // Chuyển Observable thành Promise
      return await lastValueFrom(response$);
    } catch (error) {
      this.logger.error(
        `Error sending message to pattern ${pattern}: ${error.message}`,
        error.stack
      );

      // Phân loại lỗi
      if (error instanceof ServiceTimeoutException) {
        throw error;
      }

      throw new ServiceUnavailableException("Kafka", { originalError: error });
    }
  }

  /**
   * Subscribe vào một topic
   */
  subscribeToResponseOf(pattern: string) {
    this.client.subscribeToResponseOf(pattern);
  }

  /**
   * Lấy Kafka client
   */
  getClient(): ClientKafka {
    return this.client;
  }
}
