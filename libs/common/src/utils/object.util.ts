/**
 * Lọc các thuộc tính undefined hoặc null khỏi object
 */
export function filterEmptyValues(obj: Record<string, any>): Record<string, any> {
  return Object.entries(obj)
    .filter(([_, value]) => value !== undefined && value !== null)
    .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
}

/**
 * Chuyển đổi snake_case thành camelCase
 */
export function snakeToCamel(obj: Record<string, any>): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => snakeToCamel(item));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    acc[camelKey] = value && typeof value === 'object' ? snakeToCamel(value) : value;
    return acc;
  }, {});
}

/**
 * Chuyển đổi camelCase thành snake_case
 */
export function camelToSnake(obj: Record<string, any>): Record<string, any> {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => camelToSnake(item));
  }

  return Object.entries(obj).reduce((acc, [key, value]) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    acc[snakeKey] = value && typeof value === 'object' ? camelToSnake(value) : value;
    return acc;
  }, {});
}

/**
 * Deep merge hai object
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  if (!source) return target;
  
  const output = { ...target } as any;
  
  if (target && typeof target === 'object' && source && typeof source === 'object') {
    Object.keys(source).forEach(key => {
      if (source[key] === undefined) return;
      
      if (
        typeof source[key] === 'object' && 
        source[key] !== null && 
        !Array.isArray(source[key])
      ) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  
  return output;
}
