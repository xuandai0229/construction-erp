/**
 * Định dạng số tiền Việt Nam theo chuẩn hiển thị ERP.
 * Ví dụ: 1500000 -> 1.500.000 đ
 */
export const formatVND = (amount: number | string): string => {
  const value = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (!Number.isFinite(value)) return '0 đ';
  
  return new Intl.NumberFormat('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value) + ' đ';
};

/**
 * Formats a date string to DD/MM/YYYY
 */
export const formatDate = (dateString?: string): string => {
  if (!dateString) return 'Chưa có ngày';
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Ngày không hợp lệ';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  } catch (e) {
    return 'Ngày không hợp lệ';
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
 * Định dạng tiền rút gọn, dùng cho dashboard.
 */
export const formatShortVND = (amount: number): string => {
  if (Math.abs(amount) >= 1_000_000_000) {
    return (amount / 1_000_000_000).toFixed(1).replace('.', ',') + ' tỷ';
  }
  if (Math.abs(amount) >= 1_000_000) {
    return (amount / 1_000_000).toFixed(0) + ' triệu';
  }
  if (Math.abs(amount) >= 1_000) {
    return (amount / 1_000).toFixed(0) + ' nghìn';
  }
  return new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(amount) + ' đ';
};
