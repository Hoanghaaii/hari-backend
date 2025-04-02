import { KafkaConfig as KafkaJsConfig, ProducerConfig } from 'kafkajs';

export interface KafkaConfig {
  clientId: string;
  brokers: string[];
  groupId: string;
  ssl?: KafkaJsConfig['ssl'];
  sasl?: KafkaJsConfig['sasl'];
  allowAutoTopicCreation?: boolean;
  consumeFromBeginning?: boolean;
  autoCommit?: boolean;
  idempotent?: boolean;
  producerConfig?: Omit<ProducerConfig, 'allowAutoTopicCreation' | 'idempotent'>;
}

export interface KafkaMessageOptions {
  key?: string;
  headers?: Record<string, any>;
  partition?: number;
  timestamp?: string;
  correlationId?: string;
}
