/**
 * Centralized financial math utilities for the ERP system.
 * Ensures consistent rounding and precision across all modules.
 */

/**
 * Rounds a number to exactly 2 decimal places using Number.EPSILON 
 * to avoid floating point inaccuracies.
 */
export function round(val: number | any, precision: number = 2): number {
  const num = typeof val === 'number' ? val : Number(val || 0);
  if (isNaN(num) || !isFinite(num)) return 0;
  
  const factor = Math.pow(10, precision);
  return Math.round((num + Number.EPSILON) * factor) / factor;
}

/**
 * DETERMINISTIC MONEY CONVERSION:
 * Safely converts any value (Prisma.Decimal, string, null) to a number.
 * No silent NaN allowed.
 */
export function safeMoney(val: any): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'number' ? val : Number(val);
  return (isNaN(num) || !isFinite(num)) ? 0 : num;
}

/**
 * SAFE DIVISION:
 * Prevents divide-by-zero and Infinity.
 */
export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator || denominator === 0) return 0;
  const result = numerator / denominator;
  return (isNaN(result) || !isFinite(result)) ? 0 : result;
}

/**
 * SAFE PERCENTAGE:
 * Standardized calculation for utilization, margin, etc.
 * Always returns a 2-decimal rounded number.
 */
export function safePercent(part: number, total: number): number {
  const ratio = safeDivide(part, total);
  return round(ratio * 100, 2);
}

/**
 * Safely parses a value into a number, defaulting to 0 if invalid.
 */
export function safeNumber(val: any): number {
  return safeMoney(val);
}

/**
 * Formats a number as VND currency.
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
}
