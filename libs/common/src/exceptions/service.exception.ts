import { ErrorCode } from '../enums';

/**
 * Exception cơ bản cho microservice errors
 */
export class ServiceException extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: any;

  constructor(
    message: string,
    code: string = ErrorCode.SERVICE_UNAVAILABLE,
    statusCode: number = 503,
    details?: any
  ) {
    super(message);
    this.name = 'ServiceException';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Exception khi service không khả dụng
 */
export class ServiceUnavailableException extends ServiceException {
  constructor(
    serviceName: string,
    details?: any
  ) {
    super(
      `Service ${serviceName} hiện không khả dụng. Vui lòng thử lại sau.`,
      ErrorCode.SERVICE_UNAVAILABLE,
      503,
      details
    );
    this.name = 'ServiceUnavailableException';
  }
}

/**
 * Exception khi timeout khi gọi đến service
 */
export class ServiceTimeoutException extends ServiceException {
  constructor(
    serviceName: string,
    timeoutMs: number,
    details?: any
  ) {
    super(
      `Timeout (${timeoutMs}ms) khi gọi đến service ${serviceName}.`,
      ErrorCode.TIMEOUT,
      504,
      details
    );
    this.name = 'ServiceTimeoutException';
  }
}

/**
 * Exception khi có lỗi giao tiếp với service
 */
export class ServiceCommunicationException extends ServiceException {
  constructor(
    serviceName: string,
    originalError: any
  ) {
    super(
      `Lỗi khi giao tiếp với service ${serviceName}: ${originalError?.message || 'Không xác định'}`,
      ErrorCode.COMMUNICATION_ERROR,
      500,
      { originalError }
    );
    this.name = 'ServiceCommunicationException';
  }
}
