import { Catch, ArgumentsHost, Logger, ExceptionFilter } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { KafkaContext } from '@nestjs/microservices';
import { ErrorCode } from '../enums';

interface MessageMetadata {
  id: string;
  correlationId: string;
  timestamp: number;
  source: string;
  type: string;
}

interface MessageValue {
  metadata?: MessageMetadata;
  [key: string]: any;
}

interface ErrorResponseData {
  status: 'error';
  error: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: MessageMetadata;
}

/**
 * Filter bắt lỗi RpcException trong Kafka
 */
@Catch(RpcException)
export class KafkaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(KafkaExceptionFilter.name);

  catch(exception: RpcException | Error, host: ArgumentsHost): Observable<any> {
    const ctx = host.switchToRpc();
    const kafkaContext = ctx.getContext<KafkaContext>();
    
    // Xác định error message và code
    let errorMessage = 'Internal microservice error';
    let errorCode = ErrorCode.INTERNAL_SERVER_ERROR;
    let errorDetails = null;
    let statusCode = 500;
    
    // Trích xuất thông tin lỗi
    if (exception instanceof RpcException) {
      const error = exception.getError();
      const stack = exception.stack;
      
      if (typeof error === 'string') {
        errorMessage = error;
      } else if (typeof error === 'object') {
        errorMessage = error.message || errorMessage;
        errorCode = error.code || errorCode;
        errorDetails = error.details || null;
        statusCode = error.statusCode || statusCode;
      }
    } else if (exception instanceof Error) {
      errorMessage = exception.message;
    }
    
    // Log lỗi
    this.logKafkaError(kafkaContext, errorMessage, exception);
    
    // Tìm metadata từ message gốc
    const metadata = this.extractMetadataFromContext(kafkaContext);
    
    // Tạo error response
    const errorResponse: ErrorResponseData = {
      status: 'error',
      error: {
        code: errorCode,
        message: errorMessage,
        details: errorDetails,
      },
      metadata,
    };
    
    // Trả về lỗi
    return throwError(() => errorResponse);
  }

  /**
   * Log lỗi Kafka
   */
  private logKafkaError(
    kafkaContext: KafkaContext,
    errorMessage: string,
    exception: Error,
  ): void {
    try {
      // Lấy thông tin về Kafka message
      let topic = 'unknown';
      let partition = -1;
      
      if (kafkaContext) {
        topic = kafkaContext.getTopic();
        const message = kafkaContext.getMessage();
        
        // Lấy partition nếu có
        if (message && typeof message === 'object' && 'partition' in message) {
          partition = Number(message.partition);
        }
      }
      
      // Log lỗi
      this.logger.error(
        `Kafka exception in topic ${topic} (partition ${partition}): ${errorMessage}`,
        exception.stack,
      );
    } catch (error) {
      this.logger.error(
        `Error while logging Kafka error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Trích xuất metadata từ Kafka message
   */
  private extractMetadataFromContext(kafkaContext: KafkaContext): MessageMetadata {
    try {
      if (!kafkaContext) {
        return this.createDefaultMetadata();
      }
      
      const message = kafkaContext.getMessage();
      
      // Nếu có message và value là object
      if (message && 'value' in message) {
        const value = message.value as MessageValue;
        
        // Nếu có metadata thì trả về
        if (value && typeof value === 'object' && value.metadata) {
          return value.metadata;
        }
      }
      
      // Nếu không tìm thấy metadata
      return this.createDefaultMetadata();
    } catch (error) {
      return this.createDefaultMetadata();
    }
  }

  /**
   * Tạo metadata mặc định
   */
  private createDefaultMetadata(): MessageMetadata {
    const now = Date.now();
    const id = `error-${now}`;
    
    return {
      id,
      correlationId: id,
      timestamp: now,
      source: process.env.SERVICE_NAME || 'unknown-service',
      type: 'error',
    };
  }
}
