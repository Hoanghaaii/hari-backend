import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../enums';

/**
 * Guard kiểm tra nếu user có quyền truy cập dựa trên role
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy các roles được phép từ metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không có roles requirement, cho phép truy cập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Lấy user từ request
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    // Nếu không có user hoặc user không có roles, từ chối truy cập
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    // Kiểm tra nếu user có ít nhất một role được yêu cầu
    const hasPermission = requiredRoles.some(role => user.roles.includes(role));

    if (!hasPermission) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    return true;
  }
}
