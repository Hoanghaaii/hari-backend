import { registerAs } from '@nestjs/config';
import { ValidationPipeOptions } from '@nestjs/common';

/**
 * Cấu hình validation mặc định
 */
export const validationConfig = registerAs('validation', () => ({
  whitelist: true, // Loại bỏ các trường không được định nghĩa trong DTO
  forbidNonWhitelisted: true, // Báo lỗi khi có trường không được định nghĩa
  transform: true, // Tự động chuyển đổi kiểu dữ liệu
  transformOptions: {
    enableImplicitConversion: true, // Cho phép chuyển đổi ngầm định
  },
  validationError: {
    target: false, // Không hiển thị giá trị input gốc trong lỗi
    value: false, // Không hiển thị giá trị input trong lỗi
  },
  stopAtFirstError: process.env.VALIDATION_STOP_AT_FIRST_ERROR === 'true',
}));

/**
 * Default validation pipe options
 */
export const defaultValidationOptions: ValidationPipeOptions = {
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: {
    enableImplicitConversion: true,
  },
  validationError: {
    target: false,
    value: false,
  },
};
