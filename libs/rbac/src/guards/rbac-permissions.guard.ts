import { Injectable, CanActivate, ExecutionContext, ForbiddenException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RbacMetadata, RBAC_METADATA_KEY } from '../decorators/rbac.decorator';
import { AccessControlService } from '../access-control.service';

@Injectable()
export class RbacPermissionsGuard implements CanActivate {
  private readonly logger = new Logger(RbacPermissionsGuard.name);

  constructor(
    private reflector: Reflector,
    private accessControlService: AccessControlService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    // Lấy RBAC metadata
    const rbacMetadata = this.reflector.get<RbacMetadata>(
      RBAC_METADATA_KEY,
      context.getHandler(),
    );

    // Nếu không có metadata, mặc định cho phép truy cập
    if (!rbacMetadata) {
      return true;
    }

    const { action, resource, possession, checkOwnership, ownershipField } = rbacMetadata;

    // Lấy user từ request
    const request = context.switchToHttp().getRequest();
    const { user } = request;

    // Nếu không có user hoặc user không có roles
    if (!user || !user.roles || user.roles.length === 0) {
      throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
    }

    // Kiểm tra quyền truy cập
    const isOwn = possession === 'own';
    const hasPermission = this.accessControlService.can(
      user.roles,
      action,
      resource,
      isOwn,
    );

    if (!hasPermission) {
      this.logger.warn(
        `User ${user.userId} with roles [${user.roles.join(', ')}] was denied ${action} access to ${resource}`,
      );
      throw new ForbiddenException(`Bạn không có quyền ${action} ${resource}`);
    }

    // Nếu cần kiểm tra quyền sở hữu
    if (checkOwnership && isOwn) {
      return this.checkOwnership(context, user, ownershipField);
    }

    return true;
  }

  /**
   * Kiểm tra quyền sở hữu của resource
   */
  private checkOwnership(context: ExecutionContext, user: any, ownershipField: string): boolean {
    const request = context.switchToHttp().getRequest();
    
    // Lấy resource ID từ params hoặc body
    const resourceId = request.params.id || (request.body && request.body.id);
    
    // Nếu không có resource ID, không thể kiểm tra quyền sở hữu
    if (!resourceId) {
      return true;
    }
    
    // Nếu resource đã có trong request
    const resource = request.resource;
    
    if (resource) {
      // Kiểm tra quyền sở hữu
      const ownerId = resource[ownershipField];
      
      if (ownerId && ownerId.toString() !== user.userId.toString()) {
        this.logger.warn(
          `User ${user.userId} attempted to access resource owned by ${ownerId}`,
        );
        throw new ForbiddenException('Bạn không có quyền truy cập tài nguyên này');
      }
    }
    
    // Mặc định cho phép truy cập (sẽ được service kiểm tra lại)
    return true;
  }
}
