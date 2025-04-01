/**
 * Enum cho trạng thái tài khoản người dùng
 */
export enum UserStatus {
  ACTIVE = 'active',     // Tài khoản đang hoạt động
  INACTIVE = 'inactive', // Tài khoản tạm khóa
  PENDING = 'pending',   // Tài khoản đang chờ xác minh
  BANNED = 'banned',     // Tài khoản bị cấm
}
