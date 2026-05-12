/**
 * Formats a number as Vietnamese Dong (VNĐ)
 * Example: 1500000 -> 1.500.000 VNĐ
 */
export const formatVND = (amount: number | string): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(value)) return '0 VNĐ';
  
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value).replace('₫', 'VNĐ');
};

/**
 * Formats a date string to DD/MM/YYYY
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'N/A';
    return new Intl.NumberFormat('en-GB', {
      minimumIntegerDigits: 2,
    }).format(date.getDate()) + '/' + 
    new Intl.NumberFormat('en-GB', {
      minimumIntegerDigits: 2,
    }).format(date.getMonth() + 1) + '/' + 
    date.getFullYear();
  } catch (e) {
    return 'N/A';
  }
};

/**
 * Truncates text with ellipsis if it exceeds max length
 */
export const truncate = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

/**
 * Formats a number to a short currency string (e.g., 1.2B, 500M)
 */
export const formatShortVND = (amount: number): string => {
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1) + 'B';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(0) + 'M';
  }
  if (Math.abs(amount) >= 1_000) {
    return (amount / 1_000).toFixed(0) + 'K';
  }
  return amount.toString();
};
