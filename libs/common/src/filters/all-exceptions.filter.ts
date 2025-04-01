import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { BusinessException } from '../exceptions/business.exception';
import { ErrorCode } from '../enums/error-code.enum';

/**
 * Filter bắt tất cả các loại exception và chuyển đổi thành response chuẩn
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    
    // Kiểm tra xem có đang trong HTTP context không
    if (!ctx.getRequest || !ctx.getResponse) {
      // Trường hợp không phải HTTP context (ví dụ: Kafka, WebSocket)
      this.logger.error(
        `Non-HTTP exception occurred: ${exception.message}`,
        exception.stack,
      );
      return this.handleNonHttpException(exception, host);
    }

    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();
    
    // Lấy status code và error object
    const status = this.getHttpStatus(exception);
    const errorResponse = this.getErrorResponse(exception, request);
    
    // Log lỗi
    this.logError(exception, request, status);
    
    // Trả về response
    response.status(status).json(errorResponse);
  }

  /**
   * Xử lý lỗi không phải HTTP (ví dụ: Kafka, WebSocket)
   */
  private handleNonHttpException(exception: any, host: ArgumentsHost): any {
    // Ở đây chỉ log lỗi, việc xử lý cụ thể sẽ được thực hiện bởi các filter khác
    return exception;
  }

  /**
   * Lấy HTTP status code từ exception
   */
  private getHttpStatus(exception: any): number {
    // Nếu là business exception thì lấy statusCode
    if (exception instanceof BusinessException) {
      return exception.statusCode;
    }
    
    // Nếu là HttpException thì lấy status
    if (exception.getStatus) {
      return exception.getStatus();
    }
    
    // Nếu có statusCode
    if (exception.statusCode) {
      return exception.statusCode;
    }
    
    // Mặc định là Internal Server Error
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }

  /**
   * Lấy error response từ exception
   */
  private getErrorResponse(exception: any, request: Request): any {
    // Chuẩn bị response
    const timestamp = new Date().toISOString();
    
    // Xử lý error message
    const message = exception.message || 'Internal server error';
    
    // Xử lý error code
    let errorCode: string = ErrorCode.INTERNAL_SERVER_ERROR;
    let errorDetails = null;
    
    if (exception instanceof BusinessException) {
      errorCode = exception.code;
      errorDetails = exception.details;
    } else if (exception.code) {
      errorCode = String(exception.code);
    }
    
    // Tạo error response
    return {
      status: 'error',
      statusCode: this.getHttpStatus(exception),
      message,
      error: {
        code: errorCode,
        message,
        details: errorDetails,
      },
      timestamp,
      path: request.url,
      method: request.method,
    };
  }

  /**
   * Log lỗi
   */
  private logError(exception: any, request: Request, status: number): void {
    // Tạo log message
    const message = `${request.method} ${request.url} ${status}: ${exception.message}`;
    
    // Log với level phù hợp
    if (status >= 500) {
      this.logger.error(message, exception.stack);
    } else if (status >= 400) {
      this.logger.warn(message);
    } else {
      this.logger.log(message);
    }
  }
}
