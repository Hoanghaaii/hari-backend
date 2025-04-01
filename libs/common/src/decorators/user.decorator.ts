import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../enums';

/**
 * Decorator để lấy user hiện tại từ request
 * Sử dụng trong controller: @CurrentUser() user
 */
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Nếu data được cung cấp (ví dụ: @CurrentUser('userId')), trả về thuộc tính cụ thể
    return data ? user?.[data] : user;
  },
);

/**
 * Decorator để lấy userId hiện tại từ request
 * Sử dụng trong controller: @CurrentUserId() userId
 */
export const CurrentUserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user?.userId;
  },
);

/**
 * Decorator để check roles của user hiện tại
 * Sử dụng trong controller: @HasRoles(UserRole.ADMIN) hoặc @HasRoles([UserRole.ADMIN, UserRole.SUPER_ADMIN])
 */
export const HasRoles = (roles: UserRole | UserRole[]) => {
  return createParamDecorator((data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userRoles = user.roles || [];
    const requiredRoles = Array.isArray(roles) ? roles : [roles];

    return requiredRoles.some(role => userRoles.includes(role));
  })();
};
