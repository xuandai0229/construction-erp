'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  EnterpriseEmptyState, 
  EnterpriseLoadingState, 
  EnterpriseErrorState,
  EnterpriseDataTable,
  EnterpriseColumn
} from '@/app/components/ui-enterprise';

interface InOutBalanceTableProps {
  filters: { warehouseId?: string; projectId?: string; fromDate: string; toDate: string; } | null;
}

export function InOutBalanceTable({ filters }: InOutBalanceTableProps) {
  const { data: reportRes, isLoading, error, refetch } = useQuery({
    queryKey: ['report-in-out-balance', filters],
    queryFn: async () => {
      if (!filters) return [];
      let url = `/api/inventory/reports/stock-register?fromDate=${filters.fromDate}&toDate=${filters.toDate}`;
      if (filters.warehouseId) url += `&warehouseId=${filters.warehouseId}`;
      if (filters.projectId) url += `&projectId=${filters.projectId}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!filters
  });

  const handleExportCsv = () => {
    if (!filters) return;
    let url = `/api/export/inventory/in-out-balance?fromDate=${filters.fromDate}&toDate=${filters.toDate}`;
    if (filters.warehouseId) url += `&warehouseId=${filters.warehouseId}`;
    if (filters.projectId) url += `&projectId=${filters.projectId}`;
    window.open(url, '_blank');
  };

  if (!filters) {
    return (
      <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--secondary)] rounded-xl border border-[var(--border)] text-[12px] italic">
        Vui lòng chọn Kho/Dự án và bấm "Chạy báo cáo" để kết xuất báo cáo phát sinh.
      </div>
    );
  }

  if (isLoading) {
    return <EnterpriseLoadingState message="Đang kết xuất báo cáo Nhập Xuất Tồn vật tư..." />;
  }

  if (error) {
    return (
      <EnterpriseErrorState
        title="Lỗi khi tải báo cáo"
        description="Không thể kết xuất dữ liệu Nhập Xuất Tồn từ hệ thống Sổ kho."
        onRetry={refetch}
      />
    );
  }

  const items = Array.isArray(reportRes) ? reportRes : [];
  if (items.length === 0) {
    return (
      <EnterpriseEmptyState
        title="Không có dữ liệu phát sinh"
        description="Không có giao dịch nhập xuất nào được ghi nhận trong kỳ báo cáo này."
        iconType="report"
      />
    );
  }

  const sumOp = items.reduce((s: number, i: any) => s + (i.openingAmount || 0), 0);
  const sumIn = items.reduce((s: number, i: any) => s + (i.inputAmount || 0), 0);
  const sumOut = items.reduce((s: number, i: any) => s + (i.outputAmount || 0), 0);
  const sumCl = items.reduce((s: number, i: any) => s + (i.closingAmount || 0), 0);

  const columns: EnterpriseColumn<any>[] = [
    { key: 'materialCode', header: 'Mã VT', render: row => <span className="font-bold text-[var(--text-secondary)]">{row.materialCode}</span>, width: '100px' },
    { key: 'materialName', header: 'Tên vật tư', render: row => row.materialName, minWidth: '180px' },
    { key: 'unit', header: 'ĐVT', render: row => row.unit, width: '70px', align: 'center' },
    
    { key: 'openingQuantity', header: 'ĐK SL', render: row => row.openingQuantity?.toLocaleString('vi-VN'), width: '90px', align: 'right' },
    { key: 'openingAmount', header: 'ĐK GT', render: row => `${row.openingAmount?.toLocaleString('vi-VN')} đ`, width: '120px', align: 'right', className: 'text-[var(--text-muted)]' },
    
    { key: 'inputQuantity', header: 'Nhập SL', render: row => row.inputQuantity?.toLocaleString('vi-VN'), width: '90px', align: 'right', className: 'text-emerald-500 font-bold' },
    { key: 'inputAmount', header: 'Nhập GT', render: row => `${row.inputAmount?.toLocaleString('vi-VN')} đ`, width: '120px', align: 'right', className: 'text-emerald-500 font-bold' },
    
    { key: 'outputQuantity', header: 'Xuất SL', render: row => row.outputQuantity?.toLocaleString('vi-VN'), width: '90px', align: 'right', className: 'text-rose-500 font-bold' },
    { key: 'outputAmount', header: 'Xuất GT', render: row => `${row.outputAmount?.toLocaleString('vi-VN')} đ`, width: '120px', align: 'right', className: 'text-rose-500 font-bold' },
    
    { key: 'closingQuantity', header: 'CK SL', render: row => row.closingQuantity?.toLocaleString('vi-VN'), width: '90px', align: 'right', className: 'font-bold' },
    { key: 'closingAmount', header: 'CK GT', render: row => `${row.closingAmount?.toLocaleString('vi-VN')} đ`, width: '120px', align: 'right', className: 'text-[var(--primary)] font-bold' }
  ];

  const footerElement = (
    <tr className="bg-[var(--secondary)] border-t border-[var(--border)] font-bold text-[var(--text-primary)] h-[40px] text-[11px]">
      <td className="px-4 py-2" colSpan={3}>TỔNG CỘNG TRỊ GIÁ PHÁT SINH</td>
      <td className="px-4 py-2 text-right font-mono text-[var(--text-muted)]">-</td>
      <td className="px-4 py-2 text-right font-mono text-[var(--text-muted)]">{sumOp.toLocaleString('vi-VN')} đ</td>
      <td className="px-4 py-2 text-right font-mono text-emerald-500">-</td>
      <td className="px-4 py-2 text-right font-mono text-emerald-500">{sumIn.toLocaleString('vi-VN')} đ</td>
      <td className="px-4 py-2 text-right font-mono text-rose-500">-</td>
      <td className="px-4 py-2 text-right font-mono text-rose-500">{sumOut.toLocaleString('vi-VN')} đ</td>
      <td className="px-4 py-2 text-right font-mono text-[var(--primary)]">-</td>
      <td className="px-4 py-2 text-right font-mono text-[var(--primary)]">{sumCl.toLocaleString('vi-VN')} đ</td>
    </tr>
  );

  return (
    <div className="space-y-4 bg-[var(--card)] p-5 rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
            BÁO CÁO TỔNG HỢP NHẬP XUẤT TỒN KHO (152/153)
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-widest font-semibold">
            Kỳ: {new Date(filters.fromDate).toLocaleDateString('vi-VN')} - {new Date(filters.toDate).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
        >
          Xuất Excel/CSV
        </button>
      </div>

      <EnterpriseDataTable
        data={items}
        columns={columns}
        getRowKey={(row, idx) => idx}
        minWidth="1200px"
        footer={footerElement}
      />
    </div>
  );
}
