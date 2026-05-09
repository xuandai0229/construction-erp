/**
 * Centralized financial math utilities for the ERP system.
 * Ensures consistent rounding and precision across all modules.
 */

/**
 * Rounds a number to exactly 2 decimal places using Number.EPSILON 
 * to avoid floating point inaccuracies (e.g., 1.005 rounding incorrectly).
 * 
 * @param val The number to round
 * @returns Rounded number
 */
export function round(val: number, precision: number = 2): number {
  const factor = Math.pow(10, precision);
  return Math.round((val + Number.EPSILON) * factor) / factor;
}

/**
 * Safely parses a value into a number, defaulting to 0 if invalid.
 * 
 * @param val Value to parse
 * @returns Parsed number
 */
export function safeNumber(val: any): number {
  if (val === null || val === undefined) return 0;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? 0 : num;
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
