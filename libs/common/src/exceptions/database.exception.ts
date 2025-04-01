import { MongoErrorCode, ErrorCode } from '../enums';

/**
 * Exception cho lỗi trùng lặp khóa (duplicate key) trong database
 */
export class DuplicateKeyException extends Error {
  readonly field: string;
  readonly value: string;
  readonly code: string = ErrorCode.ALREADY_EXISTS;
  readonly statusCode: number = 409;

  constructor(field: string, value: string) {
    super(`Giá trị "${value}" của trường "${field}" đã tồn tại trong hệ thống.`);
    this.name = 'DuplicateKeyException';
    this.field = field;
    this.value = value;
  }
}

/**
 * Exception cho lỗi database
 */
export class DatabaseException extends Error {
  readonly code: string = ErrorCode.DATABASE_ERROR;
  readonly statusCode: number = 500;
  readonly originalError?: any;

  constructor(message: string, originalError?: any) {
    super(message || 'Đã xảy ra lỗi khi thao tác với database.');
    this.name = 'DatabaseException';
    this.originalError = originalError;
  }

  /**
   * Factory method để tạo exception phù hợp từ lỗi MongoDB
   * @param error Lỗi gốc từ MongoDB
   * @returns Exception phù hợp
   */
  static fromMongoError(error: any): Error {
    if (error?.code === MongoErrorCode.DUPLICATE_KEY) {
      // Xử lý lỗi duplicate key
      const keyValueMatch = error.message.match(/index:\s+(\w+)_1.*dup\s+key:\s+{\s*:\s*"?([^"]+)"? }/);
      if (keyValueMatch && keyValueMatch.length >= 3) {
        const field = keyValueMatch[1];
        const value = keyValueMatch[2];
        return new DuplicateKeyException(field, value);
      } else if (error.keyPattern && error.keyValue) {
        // Fallback khi không parse được từ message
        const field = Object.keys(error.keyPattern)[0];
        const value = error.keyValue[field];
        return new DuplicateKeyException(field, String(value));
      }
    }

    // Xử lý các loại lỗi khác
    const message = error?.message || 'Đã xảy ra lỗi không xác định với database';
    return new DatabaseException(message, error);
  }
}
