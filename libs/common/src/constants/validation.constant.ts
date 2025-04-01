/**
 * Các constant dùng trong validation
 */

// Password validation
export const PASSWORD_RULES = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 32,
  REQUIRE_NUMBER: true,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_SPECIAL_CHARACTER: true,
  SPECIAL_CHARACTERS: '!@#$%^&*()_+\\-=\\[\\]{};\':"\\\\|,.<>\\/?',
};

// Username validation
export const USERNAME_RULES = {
  MIN_LENGTH: 3,
  MAX_LENGTH: 20,
  ALLOWED_CHARACTERS: '^[a-zA-Z0-9_.-]+$', // Chỉ cho phép chữ cái, số, dấu gạch dưới, dấu chấm, dấu gạch ngang
};

// Email validation
export const EMAIL_RULES = {
  MAX_LENGTH: 255,
};

// Common validation
export const VALIDATION_RULES = {
  STRING_MIN_LENGTH: 1,
  STRING_MAX_LENGTH: 255,
  TEXT_MAX_LENGTH: 2000,
  DESCRIPTION_MAX_LENGTH: 500,
  TITLE_MAX_LENGTH: 100,
  NAME_MAX_LENGTH: 50,
  CODE_MAX_LENGTH: 20,
  PRICE_MIN: 0,
  PRICE_MAX: 1000000000, // 1 tỷ
  PERCENT_MIN: 0,
  PERCENT_MAX: 100,
  QUANTITY_MIN: 0,
  QUANTITY_MAX: 1000000,
  RATING_MIN: 1,
  RATING_MAX: 5,
};
