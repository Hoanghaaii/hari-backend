import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { UserRole } from '@app/common/enums';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy các roles được phép từ metadata
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // Nếu không có roles requirement, cho phép truy cập
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Lấy user từ request
    const { user } = context.switchToHttp().getRequest();

    // Nếu không có user hoặc user không có roles
    if (!user || !user.roles) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    // Kiểm tra nếu user có ít nhất một role được yêu cầu
    const hasRole = requiredRoles.some(role => user.roles.includes(role));

    if (!hasRole) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    return true;
  }
}
