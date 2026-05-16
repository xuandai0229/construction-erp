import { Decimal } from 'decimal.js';

/**
 * Centralized financial math utilities for the ERP system.
 * Ensures consistent rounding and precision across all modules.
 * Uses Decimal.js for authoritative financial calculations.
 */

// Configure Decimal for financial standards
Decimal.set({ precision: 20, rounding: Decimal.ROUND_HALF_UP });

/**
 * Rounds a number to exactly 2 decimal places using Decimal.js
 * to avoid floating point inaccuracies.
 */
export function round(val: number | string | any, precision: number = 2): number {
  try {
    if (val === null || val === undefined) return 0;
    return new Decimal(val).toDecimalPlaces(precision).toNumber();
  } catch {
    return 0;
  }
}

/**
 * DETERMINISTIC MONEY CONVERSION:
 * Safely converts any value (Prisma.Decimal, string, null) to a number.
 * No silent NaN allowed.
 */
export function safeMoney(val: any): number {
  if (val === null || val === undefined) return 0;
  try {
    const d = new Decimal(val);
    return d.isNaN() || !d.isFinite() ? 0 : d.toNumber();
  } catch {
    return 0;
  }
}

/**
 * SAFE DECIMAL:
 * Returns a Decimal instance for arithmetic operations.
 * Guaranteed to never be NaN or Infinity.
 */
export function safeDecimal(val: any): Decimal {
  try {
    if (val === null || val === undefined) return new Decimal(0);
    const d = new Decimal(val);
    return d.isNaN() || !d.isFinite() ? new Decimal(0) : d;
  } catch {
    return new Decimal(0);
  }
}

/**
 * SAFE DIVISION:
 * Prevents divide-by-zero and Infinity using Decimal.js.
 */
export function safeDivide(numerator: any, denominator: any): number {
  const d1 = safeDecimal(numerator);
  const d2 = safeDecimal(denominator);
  
  if (d2.isZero()) return 0;
  
  try {
    return d1.dividedBy(d2).toNumber();
  } catch {
    return 0;
  }
}

/**
 * SAFE PERCENTAGE:
 * Standardized calculation for utilization, margin, etc.
 * Always returns a 2-decimal rounded number.
 */
export function safePercent(part: any, total: any): number {
  const d1 = safeDecimal(part);
  const d2 = safeDecimal(total);
  
  if (d2.isZero()) return 0;
  
  try {
    return d1.dividedBy(d2).times(100).toDecimalPlaces(2).toNumber();
  } catch {
    return 0;
  }
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
export function formatCurrency(amount: number | any): string {
  const value = safeMoney(amount);
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(value);
}
