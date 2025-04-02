import { UserRole } from "@app/common/enums";

/**
 * Interface cho JWT payload
 */
export interface JwtPayload {
  sub?: string; // Subject (userId)
  userId: string; // ID của user
  username?: string; // Username
  email?: string; // Email
  roles: UserRole[]; // Vai trò của user
  iat?: number; // Issued at (thời điểm tạo token)
  exp?: number; // Expiration time (thời điểm hết hạn)
  jti?: string; // JWT ID (unique identifier cho token)
  type?: "access" | "refresh"; // Loại token
}
