/**
 * Các regex pattern thường dùng
 */

// Username (chỉ chấp nhận chữ cái, số, dấu gạch dưới, dấu chấm, dấu gạch ngang)
export const USERNAME_REGEX = /^[a-zA-Z0-9_.-]+$/;

// Password strong (ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường, số và ký tự đặc biệt)
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[\W_])[A-Za-z\d\W_]{8,}$/;

// Email
export const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Phone number (hỗ trợ quốc tế)
export const PHONE_REGEX = /^\+?[0-9]{8,15}$/;

// URL
export const URL_REGEX = /^(https?:\/\/)?(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/;

// IPv4
export const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;

// Slugs (URL friendly)
export const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

// UUID v4
export const UUIDv4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

// Mongo ObjectId
export const MONGO_ID_REGEX = /^[0-9a-fA-F]{24}$/;

// JWT
export const JWT_REGEX = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_.+/=]*$/;
