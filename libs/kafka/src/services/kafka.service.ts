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
  private readonly defaultRequestTimeout = 10000; // 30 seconds
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
   * Gửi request và đợi response với retry logic
   */
  async send<TRequest, TResponse>(
    pattern: string,
    data: TRequest,
    options: {
      timeout?: number;
      correlationId?: string;
      headers?: Record<string, any>;
      retries?: number; // Thêm option số lần retry
      retryDelay?: number; // Thêm option độ trễ giữa các lần retry (ms)
    } = {}
  ): Promise<TResponse> {
    const maxRetries = options.retries ?? 1; // Mặc định retry 3 lần
    const retryDelay = options.retryDelay ?? 1000; // 1 giây mặc định
    let lastError: any;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Nếu không kết nối, thử kết nối lại
        if (!this.isConnected) {
          try {
            await this.client.connect();
            this.isConnected = true;
            this.logger.log(
              `Kafka client reconnected successfully on attempt ${attempt + 1}`
            );
          } catch (connError) {
            this.logger.warn(
              `Failed to reconnect to Kafka on attempt ${attempt + 1}: ${connError.message}`
            );
            // Tiếp tục vòng lặp để retry
            if (attempt < maxRetries - 1) {
              await new Promise((resolve) =>
                setTimeout(resolve, retryDelay * (attempt + 1))
              );
              continue;
            } else {
              throw new ServiceUnavailableException("Kafka", {
                originalError: connError,
              });
            }
          }
        }

        const correlationId =
          options.correlationId ||
          `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

        // Đảm bảo timeout luôn là số dương
        const requestTimeout = Math.max(
          100,
          options.timeout || this.defaultRequestTimeout
        );

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
              if (response?.status === "error" && response?.error) {
                throw new Error(response.error.message || "Unknown error");
              }
              return response?.data;
            }),
            catchError((error) => {
              // Xử lý timeout
              if (error instanceof TimeoutError) {
                throw new ServiceTimeoutException("Kafka", requestTimeout);
              }
              throw error;
            })
          );

        // Chuyển Observable thành Promise và trả về kết quả
        return await lastValueFrom(response$);
      } catch (error) {
        lastError = error;

        // Log lỗi phù hợp với attempt
        if (attempt < maxRetries - 1) {
          this.logger.warn(
            `Attempt ${attempt + 1}/${maxRetries} failed for pattern ${pattern}: ${error.message}`
          );

          // Chờ một khoảng thời gian trước khi retry
          // Thời gian chờ tăng dần theo số lần retry
          await new Promise((resolve) =>
            setTimeout(resolve, retryDelay * (attempt + 1))
          );
        } else {
          this.logger.error(
            `All ${maxRetries} attempts failed for pattern ${pattern}: ${error.message}`
          );
        }
      }
    }

    // Nếu tất cả các lần retry đều thất bại
    if (lastError instanceof ServiceTimeoutException) {
      throw lastError;
    }

    throw new ServiceUnavailableException("Kafka", {
      originalError: lastError,
    });
  }

  /**
   * Subscribe vào một topic
   */
  /**
   * Subscribe vào một topic với retry logic
   */
  subscribeToResponseOf(pattern: string, maxRetries = 3) {
    let retries = 0;

    const trySubscribe = () => {
      try {
        this.client.subscribeToResponseOf(pattern);
        this.logger.debug(`Subscribed to response of pattern ${pattern}`);
      } catch (error) {
        retries++;
        if (retries < maxRetries) {
          this.logger.warn(
            `Failed to subscribe to ${pattern}, retrying (${retries}/${maxRetries})...`
          );
          setTimeout(trySubscribe, 1000 * retries);
        } else {
          this.logger.error(
            `Failed to subscribe to ${pattern} after ${maxRetries} attempts`
          );
        }
      }
    };

    trySubscribe();
  }

  /**
   * Lấy Kafka client
   */
  getClient(): ClientKafka {
    return this.client;
  }
}
