/**
 * Interface cho metadata của Kafka message
 */
export interface KafkaMessageMetadata {
  id: string;
  timestamp: number;
  correlationId?: string;
  traceId?: string;
  source: string;
  type: string;
}

/**
 * Interface cho payload của Kafka message
 */
export interface KafkaPayload<T = any> {
  metadata: KafkaMessageMetadata;
  data: T;
}

/**
 * Interface cho Kafka response
 */
export interface KafkaResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: KafkaMessageMetadata;
}
