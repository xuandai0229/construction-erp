const fs = require('fs');

let content = fs.readFileSync('app/accounting/page.tsx', 'utf8');

// 1. Rename 'Còn phải thanh toán'
content = content.replace(
  '<EnterpriseMetric title="Còn phải thanh toán" value={formatVnd(paymentSummary.outstandingPayment)} isLoading={loading} />',
  '<EnterpriseMetric title="Còn phải thanh toán theo hóa đơn" value={formatVnd(paymentSummary.outstandingPayment)} isLoading={loading} />'
);

// 2. Add the datatable to overview tab
const dataTableComponent = `<div className="mt-8">
              <h3 className="text-sm font-bold text-[var(--text-primary)] mb-4">Danh sách công nợ theo hợp đồng</h3>
              <EnterpriseDataTable
                data={supplierContracts}
                minWidth="900px"
                columns={[
                  { key: 'supplier', header: "Nhà cung cấp", minWidth: "220px", render: (row) => \`\${row.supplierCode} - \${row.supplierName}\` },
                  { key: 'contractCode', header: "Hợp đồng", width: "150px", render: (row) => <span className="font-bold text-blue-500 hover:underline">{row.contractCode}</span> },
                  { key: 'contractValue', header: "Giá trị HĐ", width: "140px", align: "right", render: (row) => formatVnd(row.contractValue) },
                  { key: 'totalAcceptance', header: "Nghiệm thu", width: "140px", align: "right", render: (row) => formatVnd(row.totalAcceptance) },
                  { key: 'totalInvoice', header: "Hóa đơn", width: "140px", align: "right", render: (row) => formatVnd(row.totalInvoice) },
                  { key: 'totalPayment', header: "Đã TT", width: "140px", align: "right", render: (row) => formatVnd(row.totalPayment) },
                ]}
                emptyState={<EnterpriseEmptyState title="Không có hợp đồng" description="Chưa có dữ liệu công nợ hợp đồng" />}
              />
            </div>`;

content = content.replace(
  '{supplierContracts.length === 0 && !loading && (',
  `{supplierContracts.length > 0 && !loading && (
              ${dataTableComponent}
            )}
            {supplierContracts.length === 0 && !loading && (`
);

// 3. Fix the warnings ID issue
content = content.replace(
  `{warning.documentType === 'CONTRACT' ? 'Hợp đồng' : warning.documentType === 'INVOICE' ? 'Hóa đơn' : 'Chứng từ'}: {warning.documentId ? warning.documentId.slice(0, 8).toUpperCase() : 'N/A'} | Trạng thái: {warning.status === 'NEW' ? 'Cần bổ sung thông tin' : warning.status || 'Đang xử lý'}`,
  `{warning.documentType === 'CONTRACT' ? 'Hợp đồng' : warning.documentType === 'INVOICE' ? 'Hóa đơn' : 'Chứng từ'} {warning.projectName ? '- ' + warning.projectName : ''} | Trạng thái: Cần bổ sung thông tin`
);

fs.writeFileSync('app/accounting/page.tsx', content, 'utf8');
console.log('Fixed accounting page');
