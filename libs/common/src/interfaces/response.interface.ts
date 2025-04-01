import { ErrorCode } from "../enums/error-code.enum";

/**
 * Interface cho error response
 */
export interface ErrorResponse {
  code: ErrorCode | string;
  message: string;
  details?: any;
  stack?: string;
}

/**
 * Interface chuẩn cho response API
 */
export interface ApiResponse<T = any> {
  status: "success" | "error";
  statusCode: number;
  message: string;
  data?: T;
  error?: ErrorResponse;
  metadata?: {
    timestamp: string;
    path?: string;
    requestId?: string;
    [key: string]: any;
  };
}

/**
 * Interface cho các tùy chọn response
 */
export interface ResponseOptions {
  statusCode?: number;
  message?: string;
  metadata?: Record<string, any>;
}

/**
 * Interface cho service response (microservice)
 */
export interface ServiceResponse<T = any> {
  status: "success" | "error";
  data?: T;
  error?: ErrorResponse;
  metadata?: Record<string, any>;
}
