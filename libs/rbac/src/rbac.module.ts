import { Module, Global, DynamicModule } from '@nestjs/common';
import { AccessControlService } from './access-control.service';
import { RolesGuard } from './guards/roles.guard';
import { RbacPermissionsGuard } from './guards/rbac-permissions.guard';
import { UserRole } from '@app/common/enums';

export interface RbacModuleOptions {
  roles?: UserRole[];
  superRole?: UserRole;
  grantsObject?: Record<string, any>;
}

const defaultOptions: RbacModuleOptions = {
  roles: Object.values(UserRole),
  superRole: UserRole.SUPER_ADMIN,
  grantsObject: null,
};

@Global()
@Module({})
export class RbacModule {
  /**
   * Đăng ký module với cấu hình
   */
  static forRoot(options: RbacModuleOptions = {}): DynamicModule {
    const moduleOptions = { ...defaultOptions, ...options };
    
    return {
      module: RbacModule,
      providers: [
        {
          provide: 'RBAC_OPTIONS',
          useValue: moduleOptions,
        },
        AccessControlService,
        RolesGuard,
        RbacPermissionsGuard,
      ],
      exports: [
        AccessControlService,
        RolesGuard,
        RbacPermissionsGuard,
      ],
    };
  }

  /**
   * Đăng ký module với cấu hình bất đồng bộ
   */
  static forRootAsync(options: {
    imports?: any[];
    useFactory: (...args: any[]) => Promise<RbacModuleOptions> | RbacModuleOptions;
    inject?: any[];
  }): DynamicModule {
    return {
      module: RbacModule,
      imports: options.imports || [],
      providers: [
        {
          provide: 'RBAC_OPTIONS',
          useFactory: options.useFactory,
          inject: options.inject || [],
        },
        AccessControlService,
        RolesGuard,
        RbacPermissionsGuard,
      ],
      exports: [
        AccessControlService,
        RolesGuard,
        RbacPermissionsGuard,
      ],
    };
  }
}
