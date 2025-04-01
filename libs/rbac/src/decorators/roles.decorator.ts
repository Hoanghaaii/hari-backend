import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@app/common/enums';

export const ROLES_KEY = 'roles';

/**
 * Decorator để xác định roles được phép truy cập
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
