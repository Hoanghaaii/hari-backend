import { Transform } from 'class-transformer';

/**
 * Decorator để trim string
 * Sử dụng trong DTO: @Trim() name: string
 */
export function Trim() {
  return Transform(({ value }) => {
    return typeof value === 'string' ? value.trim() : value;
  });
}

/**
 * Decorator để chuyển đổi string thành lowercase
 * Sử dụng trong DTO: @ToLowerCase() email: string
 */
export function ToLowerCase() {
  return Transform(({ value }) => {
    return typeof value === 'string' ? value.toLowerCase() : value;
  });
}

/**
 * Decorator để chuyển đổi string thành uppercase
 * Sử dụng trong DTO: @ToUpperCase() code: string
 */
export function ToUpperCase() {
  return Transform(({ value }) => {
    return typeof value === 'string' ? value.toUpperCase() : value;
  });
}

/**
 * Decorator để bỏ khoảng trắng và kí tự đặc biệt
 * Sử dụng trong DTO: @Sanitize() username: string
 */
export function Sanitize(regex = /[^\w\s]/g) {
  return Transform(({ value }) => {
    return typeof value === 'string' ? value.replace(regex, '') : value;
  });
}

/**
 * Decorator để chuyển đổi string thành boolean
 * Sử dụng trong DTO: @ToBoolean() isActive: boolean
 */
export function ToBoolean() {
  return Transform(({ value }) => {
    if (value === true || value === false) return value;
    if (value === 'true' || value === '1' || value === 1) return true;
    if (value === 'false' || value === '0' || value === 0) return false;
    return value;
  });
}

/**
 * Decorator để chuyển đổi string thành number
 * Sử dụng trong DTO: @ToNumber() age: number
 */
export function ToNumber() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return Number(value);
  });
}

/**
 * Decorator để chuyển đổi string thành date
 * Sử dụng trong DTO: @ToDate() birthDate: Date
 */
export function ToDate() {
  return Transform(({ value }) => {
    if (value === undefined || value === null) return value;
    return new Date(value);
  });
}
