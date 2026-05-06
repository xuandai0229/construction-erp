import { ApiError } from "./api-error";

/**
 * Validates that an entity has all required fields and correct data types.
 * Prevents NaN and undefined from entering the database or being sent to UI.
 */
export function assertValidEntity<T extends object>(data: T, entityName: string): void {
  const entries = Object.entries(data);
  
  for (const [key, value] of entries) {
    // 1. Check for undefined/NaN in required fields
    if (value === undefined) {
      throw new ApiError(400, `Field "${key}" in ${entityName} is undefined`);
    }
    
    if (typeof value === 'number' && isNaN(value)) {
      throw new ApiError(400, `Field "${key}" in ${entityName} is NaN`);
    }

    // 2. Deep validation for nested objects (if needed)
    if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
      assertValidEntity(value as object, `${entityName}.${key}`);
    }
  }
}

/**
 * Safely parses a number, returning 0 instead of NaN.
 */
export function safeNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? 0 : num;
}
