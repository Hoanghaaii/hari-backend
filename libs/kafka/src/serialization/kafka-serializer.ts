import { Logger } from '@nestjs/common';
import { KafkaPayload, KafkaMessageMetadata } from '../interfaces/kafka-payload.interface';

/**
 * Class để serialize và deserialize Kafka messages
 */
export class KafkaSerializer {
  private readonly logger = new Logger(KafkaSerializer.name);

  /**
   * Serialize message thành dạng JSON string
   */
  serialize(value: any, options: { type: string } = { type: 'event' }): Buffer {
    try {
      // Nếu đã là KafkaPayload, trả về như vậy
      if (value && value.metadata && value.data !== undefined) {
        return Buffer.from(JSON.stringify(value));
      }

      // Tạo metadata
      const metadata: KafkaMessageMetadata = {
        id: this.generateId(),
        timestamp: Date.now(),
        source: process.env.SERVICE_NAME || 'unknown',
        type: options.type,
        correlationId: options.type === 'response' ? value.correlationId : undefined,
      };

      // Tạo payload
      const payload: KafkaPayload = {
        metadata,
        data: value,
      };

      return Buffer.from(JSON.stringify(payload));
    } catch (error) {
      this.logger.error(`Error serializing Kafka message: ${error.message}`);
      throw error;
    }
  }

  /**
   * Deserialize message từ dạng Buffer thành object
   */
  deserialize(message: Buffer): KafkaPayload {
    try {
      const content = message.toString();
      
      // Parse JSON content
      const parsed = JSON.parse(content);
      
      // Kiểm tra nếu là KafkaPayload hợp lệ
      if (parsed && parsed.metadata && parsed.data !== undefined) {
        return parsed as KafkaPayload;
      }
      
      // Nếu không phải KafkaPayload, bọc lại
      this.logger.warn('Deserializing non-KafkaPayload message, wrapping it');
      
      return {
        metadata: {
          id: this.generateId(),
          timestamp: Date.now(),
          source: 'unknown',
          type: 'unknown',
        },
        data: parsed,
      };
    } catch (error) {
      this.logger.error(`Error deserializing Kafka message: ${error.message}`);
      
      // Trả về default payload trong trường hợp lỗi
      return {
        metadata: {
          id: this.generateId(),
          timestamp: Date.now(),
          source: 'unknown',
          type: 'error',
        },
        data: null,
        error: {
          message: `Error deserializing message: ${error.message}`,
          originalMessage: message.toString(),
        },
      } as any;
    }
  }

  /**
   * Tạo ID ngẫu nhiên
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}
