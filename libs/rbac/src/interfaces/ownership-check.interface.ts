/**
 * Interface định nghĩa phương thức kiểm tra quyền sở hữu
 */
export interface OwnershipChecker<T = any> {
  /**
   * Kiểm tra xem người dùng có sở hữu resource hay không
   * @param userId ID của người dùng
   * @param resourceId ID của resource
   * @param resource Resource object nếu đã có
   */
  checkOwnership(userId: string, resourceId: string, resource?: T): Promise<boolean>;
}
