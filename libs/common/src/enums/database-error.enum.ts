/**
 * Enum cho các mã lỗi MongoDB
 */
export enum MongoErrorCode {
  DUPLICATE_KEY = 11000,  // Lỗi trùng lặp khóa duy nhất (ví dụ: email, username)
  VALIDATION_ERROR = 121, // Lỗi validation rule của MongoDB
  TIMEOUT = 50,           // Lỗi timeout khi kết nối đến MongoDB
  NETWORK_ERROR = 89,     // Lỗi mạng khi giao tiếp với MongoDB
  UNAUTHORIZED = 13,      // Lỗi khi không có quyền truy cập vào collection/database
  INVALID_QUERY = 9,      // Lỗi khi truy vấn không hợp lệ
}
