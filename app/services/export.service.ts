
/**
 * Legacy CSV export service.
 * Chỉ dùng cho dữ liệu phi tài chính. Báo cáo/chứng từ kế toán bắt buộc dùng auditedCsvExport hoặc endpoint server-side.
 */
const FINANCIAL_EXPORT_KEYWORDS = [
  "financial",
  "accounting",
  "debt",
  "payment",
  "cost",
  "revenue",
  "budget",
  "ledger",
  "invoice",
  "advance",
  "cash",
  "bank",
  "journal",
  "trial-balance",
  "balance-sheet",
  "profit",
  "loss",
  "công nợ",
  "thanh toán",
  "chi phí",
  "doanh thu",
  "dự toán",
  "sổ cái",
  "hóa đơn",
  "tạm ứng",
];

export function assertNonFinancialClientExport(metadata: { filename?: string; reportType?: string; reason?: string }) {
  const haystack = `${metadata.filename || ""} ${metadata.reportType || ""} ${metadata.reason || ""}`.toLowerCase();
  const matched = FINANCIAL_EXPORT_KEYWORDS.find(keyword => haystack.includes(keyword));
  if (matched) {
    throw new Error(`Không được xuất dữ liệu tài chính bằng export client-side legacy (${matched}). Vui lòng dùng auditedCsvExport hoặc endpoint server-side đã audit.`);
  }
}

export function legacyExportCsvNonFinancialOnly(filename: string, arg2: any[] | string[], arg3?: any[][]) {
  assertNonFinancialClientExport({ filename });
  if (!arg2 || (Array.isArray(arg2) && arg2.length === 0)) return;

  // Add BOM for Excel UTF-8 support (Ensures Vietnamese characters display correctly)
  const BOM = "\uFEFF";
  
  let headers: string[] = [];
  let rows: any[][] = [];

  const escapeCsvValue = (val: any) => {
    if (val === null || val === undefined) return "";
    let stringVal = String(val);
    // Replace double quotes with two double quotes
    stringVal = stringVal.replace(/"/g, '""');
    // Wrap in double quotes if it contains a comma, newline or double quote
    if (stringVal.includes(',') || stringVal.includes('\n') || stringVal.includes('"')) {
      stringVal = `"${stringVal}"`;
    }
    return stringVal;
  };

  // Determine format
  if (arg3 && Array.isArray(arg3)) {
    // Format: (filename, headers, rows)
    headers = arg2 as string[];
    rows = arg3;
  } else {
    // Format: (filename, dataObjects)
    const data = arg2 as any[];
    headers = Object.keys(data[0]);
    rows = data.map(item => headers.map(h => item[h]));
  }

  const csvRows = [
    headers.map(escapeCsvValue).join(','),
    ...rows.map(row => row.map(escapeCsvValue).join(','))
  ];

  const csvContent = BOM + csvRows.join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = window.URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  
  // Ensure filename has .csv extension and timestamp
  const dateStr = new Date().toISOString().split('T')[0];
  const cleanFilename = filename.toLowerCase().endsWith('.csv') ? filename.slice(0, -4) : filename;
  link.setAttribute('download', `${cleanFilename}_${dateStr}.csv`);
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}

/**
 * @deprecated Chỉ giữ để tương thích màn hình phi tài chính cũ. Không dùng cho báo cáo/chứng từ kế toán.
 */
export function exportToCsv(filename: string, arg2: any[] | string[], arg3?: any[][]) {
  return legacyExportCsvNonFinancialOnly(filename, arg2, arg3);
}
