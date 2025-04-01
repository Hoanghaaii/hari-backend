/**
 * Các constant dùng chung trong toàn bộ ứng dụng
 */

export const APP_NAME = 'Hari Backend';

export const DEFAULT_PORT = 3000;

// Hằng số cho JWT
export const JWT_CONSTANTS = {
  ACCESS_TOKEN_SECRET: process.env.JWT_ACCESS_TOKEN_SECRET || 'accessTokenSecret',
  REFRESH_TOKEN_SECRET: process.env.JWT_REFRESH_TOKEN_SECRET || 'refreshTokenSecret',
  ACCESS_TOKEN_EXPIRATION: process.env.JWT_ACCESS_TOKEN_EXPIRATION || '15m',
  REFRESH_TOKEN_EXPIRATION: process.env.JWT_REFRESH_TOKEN_EXPIRATION || '7d',
};

// Giá trị mặc định cho phân trang
export const DEFAULT_PAGINATION = {
  PAGE: 1,
  LIMIT: 10,
  MAX_LIMIT: 100,
  SORT_BY: 'createdAt',
  SORT_ORDER: 'desc' as 'asc' | 'desc',
};

// Service names
export const SERVICE_NAMES = {
  API_GATEWAY: 'api-gateway',
  USER_SERVICE: 'user-service',
  AUTH_SERVICE: 'auth-service',
  PRODUCT_SERVICE: 'product-service',
  AI_SERVICE: 'ai-service',
};

// Rate Limiting
export const RATE_LIMIT = {
  POINTS: 60, // Số request tối đa
  DURATION: 60, // Thời gian (giây)
  BLOCK_DURATION: 60, // Thời gian chặn khi vượt quá giới hạn (giây)
};

// Cache keys
export const CACHE_KEYS = {
  USER_PREFIX: 'user:',
  PRODUCT_PREFIX: 'product:',
  CATEGORY_PREFIX: 'category:',
  SETTINGS_PREFIX: 'settings:',
};

// Cache TTL (seconds)
export const CACHE_TTL = {
  USER: 30 * 60, // 30 phút
  PRODUCT: 10 * 60, // 10 phút
  CATEGORY: 60 * 60, // 1 giờ
  SETTINGS: 24 * 60 * 60, // 1 ngày
};
