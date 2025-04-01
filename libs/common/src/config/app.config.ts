import { registerAs } from '@nestjs/config';

/**
 * Cấu hình ứng dụng cơ bản
 */
export const appConfig = registerAs('app', () => ({
  name: process.env.APP_NAME || 'Hari Backend',
  port: parseInt(process.env.PORT || '3000', 10),
  env: process.env.NODE_ENV || 'development',
  debug: process.env.DEBUG === 'true',
  timezone: process.env.TZ || 'Asia/Ho_Chi_Minh',
  url: process.env.APP_URL || `http://localhost:${process.env.PORT || '3000'}`,
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4000',
  apiPrefix: process.env.API_PREFIX || 'api',
  isProduction: process.env.NODE_ENV === 'production',
  isDevelopment: process.env.NODE_ENV === 'development',
  isTest: process.env.NODE_ENV === 'test',
}));
