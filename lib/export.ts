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
  "công nợ",
  "thanh toán",
  "chi phí",
  "doanh thu",
  "dự toán",
  "sổ cái",
  "hóa đơn",
  "tạm ứng",
];

function assertNonFinancialClientExport(filename: string) {
  const lower = filename.toLowerCase();
  const matched = FINANCIAL_EXPORT_KEYWORDS.find(keyword => lower.includes(keyword));
  if (matched) {
    throw new Error(`Không được xuất dữ liệu tài chính bằng helper legacy (${matched}). Vui lòng dùng endpoint server-side đã audit.`);
  }
}

export function exportToJSON(data: any, filename: string) {
  assertNonFinancialClientExport(filename);
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportToCSV(data: any[], filename: string) {
  assertNonFinancialClientExport(filename);
  if (data.length === 0) return;
  
  const headers = Object.keys(data[0]);
  const csvContent = [
    headers.join(','),
    ...data.map(row => headers.map(header => {
      const val = row[header];
      return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
