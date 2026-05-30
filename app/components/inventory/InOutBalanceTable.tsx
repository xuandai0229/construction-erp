'use client';

import { useQuery } from '@tanstack/react-query';
import { EnterpriseEmptyState, EnterpriseLoadingState, EnterpriseErrorState } from '@/app/components/ui-enterprise';

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
      <div className="p-8 text-center text-[var(--text-muted)] italic bg-[var(--secondary)] rounded-xl border border-[var(--border)]">
        Vui lòng chọn Kho/Dự án và bấm "Chạy báo cáo".
      </div>
    );
  }

  if (isLoading) {
    return <EnterpriseLoadingState message="Đang kết xuất báo cáo Nhập Xuất Tồn..." />;
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

  return (
    <div className="space-y-4 bg-[var(--card)] p-5 rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
            BÁO CÁO TỔNG HỢP NHẬP XUẤT TỒN KHO
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-widest font-semibold">
            Kỳ: {new Date(filters.fromDate).toLocaleDateString('vi-VN')} - {new Date(filters.toDate).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-primary)] border border-[var(--border)] transition-colors"
        >
          Xuất Excel/CSV
        </button>
      </div>

      <div className="overflow-x-auto rounded-lg border border-[var(--border)]">
        <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
          <thead className="bg-[var(--secondary)] border-b border-[var(--border)] text-[var(--text-secondary)] font-bold uppercase tracking-wider">
            <tr>
              <th className="p-2">Mã VT</th>
              <th className="p-2">Tên vật tư</th>
              <th className="p-2">ĐVT</th>
              <th className="p-2 text-right">ĐK SL</th>
              <th className="p-2 text-right">ĐK GT</th>
              <th className="p-2 text-right">Nhập SL</th>
              <th className="p-2 text-right">Nhập GT</th>
              <th className="p-2 text-right">Xuất SL</th>
              <th className="p-2 text-right">Xuất GT</th>
              <th className="p-2 text-right">CK SL</th>
              <th className="p-2 text-right">CK GT</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
            {items.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-[var(--secondary)]/20 transition-colors">
                <td className="p-2 font-bold text-[var(--text-secondary)]">{item.materialCode}</td>
                <td className="p-2">{item.materialName}</td>
                <td className="p-2">{item.unit}</td>
                <td className="p-2 text-right font-mono">{item.openingQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono text-[var(--text-muted)]">{item.openingAmount?.toLocaleString('vi-VN')} đ</td>
                <td className="p-2 text-right font-mono text-emerald-500">{item.inputQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono text-emerald-500">{item.inputAmount?.toLocaleString('vi-VN')} đ</td>
                <td className="p-2 text-right font-mono text-amber-500">{item.outputQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono text-amber-500">{item.outputAmount?.toLocaleString('vi-VN')} đ</td>
                <td className="p-2 text-right font-mono font-bold">{item.closingQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono font-bold text-blue-500">{item.closingAmount?.toLocaleString('vi-VN')} đ</td>
              </tr>
            ))}
            <tr className="bg-[var(--secondary)] font-black text-[var(--text-primary)]">
              <td className="p-2" colSpan={4}>TỔNG CỘNG TRỊ GIÁ</td>
              <td className="p-2 text-right font-mono text-[var(--text-muted)]">{sumOp.toLocaleString('vi-VN')} đ</td>
              <td className="p-2"></td>
              <td className="p-2 text-right font-mono text-emerald-500">{sumIn.toLocaleString('vi-VN')} đ</td>
              <td className="p-2"></td>
              <td className="p-2 text-right font-mono text-amber-500">{sumOut.toLocaleString('vi-VN')} đ</td>
              <td className="p-2"></td>
              <td className="p-2 text-right font-mono text-blue-500">{sumCl.toLocaleString('vi-VN')} đ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
