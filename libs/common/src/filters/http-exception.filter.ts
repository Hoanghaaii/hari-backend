import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorCode } from '../enums/error-code.enum';

/**
 * Filter bắt HttpException và chuyển đổi thành response chuẩn
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const status = exception.getStatus();
    
    // Lấy response từ exception
    const errorResponse = exception.getResponse();
    
    // Tạo error object
    const error = {
      status: 'error',
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message: this.getErrorMessage(errorResponse),
      error: {
        code: this.getErrorCode(status, errorResponse),
        message: this.getErrorMessage(errorResponse),
        details: this.getErrorDetails(errorResponse),
      },
    };
    
    // Log lỗi
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} ${status}: ${JSON.stringify(error)}`,
        exception.stack,
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} ${status}: ${JSON.stringify(error)}`,
      );
    }
    
    // Trả về response
    response.status(status).json(error);
  }

  /**
   * Lấy error message từ response
   */
  private getErrorMessage(errorResponse: any): string {
    // Nếu là string thì trả về
    if (typeof errorResponse === 'string') {
      return errorResponse;
    }
    
    // Nếu có message
    if (errorResponse.message) {
      // Nếu message là array
      if (Array.isArray(errorResponse.message)) {
        return errorResponse.message[0];
      }
      return errorResponse.message;
    }
    
    // Fallback
    return 'An error occurred';
  }

  /**
   * Lấy error code từ status và response
   */
  private getErrorCode(status: number, errorResponse: any): string {
    // Nếu có code
    if (errorResponse.code) {
      return errorResponse.code;
    }
    
    // Map status code sang error code
    switch (status) {
      case 400:
        return ErrorCode.VALIDATION_ERROR;
      case 401:
        return ErrorCode.UNAUTHORIZED;
      case 403:
        return ErrorCode.FORBIDDEN;
      case 404:
        return ErrorCode.NOT_FOUND;
      case 409:
        return ErrorCode.CONFLICT;
      case 500:
        return ErrorCode.INTERNAL_SERVER_ERROR;
      default:
        return `HTTP_ERROR_${status}`;
    }
  }

  /**
   * Lấy error details từ response
   */
  private getErrorDetails(errorResponse: any): any {
    // Nếu là object và có message là array
    if (typeof errorResponse === 'object' && Array.isArray(errorResponse.message)) {
      return { errors: errorResponse.message };
    }
    
    // Nếu có details
    if (errorResponse.details) {
      return errorResponse.details;
    }
    
    // Nếu có errors
    if (errorResponse.errors) {
      return { errors: errorResponse.errors };
    }
    
    // Nếu là validation error từ class-validator
    if (typeof errorResponse === 'object' && errorResponse.message instanceof Object) {
      return { errors: errorResponse.message };
    }
    
    return null;
  }
}
