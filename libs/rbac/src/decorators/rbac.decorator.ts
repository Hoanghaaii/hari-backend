import { SetMetadata } from '@nestjs/common';

export const RBAC_METADATA_KEY = 'rbac_metadata';

export interface RbacMetadata {
  action: string;        // Hành động: create, read, update, delete
  resource: string;      // Tài nguyên: user, product, category...
  possession?: 'own' | 'any'; // Sở hữu: own (chỉ của mình), any (bất kỳ)
  checkOwnership?: boolean; // Có kiểm tra quyền sở hữu hay không
  ownershipField?: string;  // Trường để kiểm tra quyền sở hữu
}

/**
 * Decorator để xác định quyền RBAC
 */
export function RBAC(
  action: string,
  resource: string,
  possession: 'own' | 'any' = 'any',
  options: {
    checkOwnership?: boolean;
    ownershipField?: string;
  } = {},
) {
  const metadata: RbacMetadata = {
    action,
    resource,
    possession,
    checkOwnership: options.checkOwnership ?? (possession === 'own'),
    ownershipField: options.ownershipField || 'userId',
  };
  
  return SetMetadata(RBAC_METADATA_KEY, metadata);
}
