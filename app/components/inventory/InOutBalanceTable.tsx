'use client';

import { useQuery } from '@tanstack/react-query';
import { EnterpriseEmptyState } from '@/app/components/ui-enterprise';

interface InOutBalanceTableProps {
  filters: { warehouseId?: string; projectId?: string; fromDate: string; toDate: string; } | null;
}

export function InOutBalanceTable({ filters }: InOutBalanceTableProps) {
  const { data: reportRes, isLoading, error } = useQuery({
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

  if (!filters) return <div className="p-8 text-center text-zinc-500 italic bg-zinc-900/10 rounded-xl border border-zinc-800/40">Vui lòng chọn Kho/Dự án và bấm &quot;Chạy báo cáo&quot;.</div>;
  if (isLoading) return <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-12 w-full animate-pulse bg-zinc-800/40 rounded-lg" />)}</div>;
  if (error) return <div className="p-4 rounded bg-red-950/20 border border-red-900/50 text-red-400">Lỗi khi tải báo cáo Nhập Xuất Tồn.</div>;

  const items = Array.isArray(reportRes) ? reportRes : [];
  if (items.length === 0) return <EnterpriseEmptyState title="Không có dữ liệu phát sinh" description="Không có giao dịch nhập xuất nào trong kỳ." />;

  const sumOp = items.reduce((s: number, i: any) => s + (i.openingAmount || 0), 0);
  const sumIn = items.reduce((s: number, i: any) => s + (i.inputAmount || 0), 0);
  const sumOut = items.reduce((s: number, i: any) => s + (i.outputAmount || 0), 0);
  const sumCl = items.reduce((s: number, i: any) => s + (i.closingAmount || 0), 0);

  return (
    <div className="space-y-4 bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/80">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">BÁO CÁO TỔNG HỢP NHẬP XUẤT TỒN KHO</h3>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-semibold">Kỳ: {new Date(filters.fromDate).toLocaleDateString('vi-VN')} - {new Date(filters.toDate).toLocaleDateString('vi-VN')}</p>
        </div>
        <button onClick={handleExportCsv} className="px-4 py-2 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">Xuất CSV</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-xs text-left border-collapse min-w-[1000px]">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
            <tr><th className="p-2">Mã VT</th><th className="p-2">Tên vật tư</th><th className="p-2">ĐVT</th><th className="p-2 text-right">ĐK SL</th><th className="p-2 text-right">ĐK GT</th><th className="p-2 text-right">Nhập SL</th><th className="p-2 text-right">Nhập GT</th><th className="p-2 text-right">Xuất SL</th><th className="p-2 text-right">Xuất GT</th><th className="p-2 text-right">CK SL</th><th className="p-2 text-right">CK GT</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-200">
            {items.map((item: any, idx: number) => (
              <tr key={idx} className="hover:bg-zinc-800/20">
                <td className="p-2 font-bold text-zinc-300">{item.materialCode}</td>
                <td className="p-2">{item.materialName}</td>
                <td className="p-2">{item.unit}</td>
                <td className="p-2 text-right font-mono">{item.openingQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono text-zinc-400">{item.openingAmount?.toLocaleString('vi-VN')} đ</td>
                <td className="p-2 text-right font-mono text-emerald-400">{item.inputQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono text-emerald-500">{item.inputAmount?.toLocaleString('vi-VN')} đ</td>
                <td className="p-2 text-right font-mono text-orange-400">{item.outputQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono text-orange-500">{item.outputAmount?.toLocaleString('vi-VN')} đ</td>
                <td className="p-2 text-right font-mono font-bold text-white">{item.closingQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono font-bold text-blue-400">{item.closingAmount?.toLocaleString('vi-VN')} đ</td>
              </tr>
            ))}
            <tr className="bg-zinc-900 font-black text-white">
              <td className="p-2" colSpan={4}>TỔNG CỘNG TRỊ GIÁ</td>
              <td className="p-2 text-right font-mono text-zinc-400">{sumOp.toLocaleString('vi-VN')} đ</td>
              <td className="p-2"></td>
              <td className="p-2 text-right font-mono text-emerald-500">{sumIn.toLocaleString('vi-VN')} đ</td>
              <td className="p-2"></td>
              <td className="p-2 text-right font-mono text-orange-500">{sumOut.toLocaleString('vi-VN')} đ</td>
              <td className="p-2"></td>
              <td className="p-2 text-right font-mono text-blue-400">{sumCl.toLocaleString('vi-VN')} đ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
