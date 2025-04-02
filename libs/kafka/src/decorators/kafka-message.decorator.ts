import { applyDecorators, SetMetadata } from '@nestjs/common';
import { KafkaPayload } from '../interfaces/kafka-payload.interface';

export const KAFKA_MESSAGE_METADATA = 'kafka_message_metadata';

/**
 * Interface để định nghĩa metadata cho Kafka Message
 */
export interface KafkaMessageMetadataOptions {
  version?: string;
  type?: string;
}

/**
 * Decorator để áp dụng metadata cho Kafka message
 */
export function KafkaMessage(options: KafkaMessageMetadataOptions = {}) {
  return applyDecorators(
    SetMetadata(KAFKA_MESSAGE_METADATA, options),
  );
}

/**
 * Method Decorator để chỉ định interceptor của payload
 */
export const KAFKA_PAYLOAD_INTERCEPTOR = 'kafka_payload_interceptor';

export type KafkaPayloadInterceptorFn = (payload: any) => KafkaPayload<any> | Promise<KafkaPayload<any>>;

export function KafkaPayloadInterceptor(interceptorFn: KafkaPayloadInterceptorFn) {
  return SetMetadata(KAFKA_PAYLOAD_INTERCEPTOR, interceptorFn);
}
