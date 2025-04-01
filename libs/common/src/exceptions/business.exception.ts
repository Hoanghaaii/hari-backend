import { ErrorCode } from '../enums';

/**
 * Exception khi có lỗi nghiệp vụ
 */
export class BusinessException extends Error {
  readonly code: string;
  readonly statusCode: number;
  readonly details?: any;

  constructor(
    message: string,
    code: string = ErrorCode.BUSINESS_RULE_VIOLATION,
    statusCode: number = 400,
    details?: any
  ) {
    super(message);
    this.name = 'BusinessException';
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
  }
}

/**
 * Exception khi resource không tồn tại
 */
export class ResourceNotFoundException extends BusinessException {
  constructor(
    resourceType: string,
    resourceId: string | number
  ) {
    super(
      `${resourceType} với ID ${resourceId} không tồn tại.`,
      ErrorCode.NOT_FOUND,
      404
    );
    this.name = 'ResourceNotFoundException';
  }
}

/**
 * Exception khi resource đã tồn tại
 */
export class ResourceAlreadyExistsException extends BusinessException {
  constructor(
    resourceType: string,
    field: string,
    value: string
  ) {
    super(
      `${resourceType} với ${field} = "${value}" đã tồn tại.`,
      ErrorCode.ALREADY_EXISTS,
      409
    );
    this.name = 'ResourceAlreadyExistsException';
  }
}

/**
 * Exception khi người dùng không có quyền
 */
export class ForbiddenException extends BusinessException {
  constructor(message: string = 'Bạn không có quyền thực hiện hành động này.') {
    super(
      message,
      ErrorCode.FORBIDDEN,
      403
    );
    this.name = 'ForbiddenException';
  }
}

/**
 * Exception khi người dùng chưa xác thực
 */
export class UnauthorizedException extends BusinessException {
  constructor(message: string = 'Bạn cần đăng nhập để thực hiện hành động này.') {
    super(
      message,
      ErrorCode.UNAUTHORIZED,
      401
    );
    this.name = 'UnauthorizedException';
  }
}

/**
 * Exception khi dữ liệu không hợp lệ
 */
export class ValidationException extends BusinessException {
  constructor(message: string, details?: any) {
    super(
      message,
      ErrorCode.VALIDATION_ERROR,
      400,
      details
    );
    this.name = 'ValidationException';
  }
}
