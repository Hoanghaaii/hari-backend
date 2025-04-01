import { Injectable, Inject, OnModuleInit, Logger } from '@nestjs/common';
import { AccessControl } from 'accesscontrol';
import { UserRole } from '@app/common/enums';
import { RbacModuleOptions } from './rbac.module';

@Injectable()
export class AccessControlService implements OnModuleInit {
  private readonly logger = new Logger(AccessControlService.name);
  private ac: AccessControl;

  constructor(
    @Inject('RBAC_OPTIONS')
    private readonly options: RbacModuleOptions,
  ) {
    this.ac = new AccessControl();
  }

  onModuleInit() {
    // Nếu có grants object từ options, sử dụng nó
    if (this.options.grantsObject) {
      this.ac.setGrants(this.options.grantsObject);
      this.logger.log('Access Control initialized with provided grants');
      return;
    }

    // Nếu không, tạo grants mặc định
    this.initializeDefaultGrants();
    this.logger.log('Access Control initialized with default grants');
  }

  /**
   * Khởi tạo grants mặc định cho tất cả roles
   */
  private initializeDefaultGrants() {
    // Super Admin - có tất cả quyền
    this.ac.grant(UserRole.SUPER_ADMIN)
      .createAny('*')
      .readAny('*')
      .updateAny('*')
      .deleteAny('*');
    
    // Admin - có quyền quản lý hầu hết mọi thứ
    this.ac.grant(UserRole.ADMIN)
      .createAny('user')
      .readAny('user')
      .updateAny('user')
      .deleteAny('user')
      .createAny('product')
      .readAny('product')
      .updateAny('product')
      .deleteAny('product')
      .createAny('category')
      .readAny('category')
      .updateAny('category')
      .deleteAny('category');
    
    // Seller - quản lý sản phẩm của mình
    this.ac.grant(UserRole.SELLER)
      .readOwn('user')
      .updateOwn('user')
      .createOwn('product')
      .readAny('product')
      .updateOwn('product')
      .deleteOwn('product')
      .readAny('category');
    
    // User - người dùng bình thường
    this.ac.grant(UserRole.USER)
      .readOwn('user')
      .updateOwn('user')
      .readAny('product')
      .readAny('category');
  }

  /**
   * Kiểm tra quyền truy cập
   */
  can(roles: string[], action: string, resource: string, isOwn = false): boolean {
    const possession = isOwn ? 'own' : 'any';
    
    // Nếu có super role, luôn cho phép
    if (this.options.superRole && roles.includes(this.options.superRole)) {
      return true;
    }
    
    // Kiểm tra từng role
    for (const role of roles) {
      try {
        const permission = this.ac.can(role)[`${action}${capitalize(possession)}`](resource);
        if (permission.granted) {
          return true;
        }
      } catch (error) {
        this.logger.warn(`Error checking permission for role ${role}: ${error.message}`);
      }
    }
    
    return false;
  }

  /**
   * Lấy Access Control instance
   */
  getAccessControl(): AccessControl {
    return this.ac;
  }

  /**
   * Đặt grants
   */
  setGrants(grantsObject: Record<string, any>): void {
    this.ac.setGrants(grantsObject);
  }

  /**
   * Thêm quyền cho role
   */
  grant(role: string): any {
    return this.ac.grant(role);
  }

  /**
   * Thu hồi quyền cho role (chỉ sử dụng với revokeAll, không hỗ trợ revoke)
   */
  revoke(role: string): void {
    // AccessControl không có phương thức revoke trực tiếp
    // Chúng ta có thể xóa role và tạo lại
    const grants = this.ac.getGrants();
    if (grants[role]) {
      delete grants[role];
      this.ac.setGrants(grants);
    }
  }
}

/**
 * Helper function để capitalize chuỗi
 */
function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
