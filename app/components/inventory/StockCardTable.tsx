'use client';

import { useQuery } from '@tanstack/react-query';
import { EnterpriseEmptyState } from '@/app/components/ui-enterprise';

interface StockCardTableProps {
  filters: { warehouseId?: string; materialItemId?: string; projectId?: string; wbsId?: string; fromDate: string; toDate: string; } | null;
  onDrillDown: (docNo: string) => void;
}

export function StockCardTable({ filters, onDrillDown }: StockCardTableProps) {
  const { data: reportRes, isLoading, error } = useQuery({
    queryKey: ['report-stock-card', filters],
    queryFn: async () => {
      if (!filters?.warehouseId || !filters?.materialItemId) return null;
      let url = `/api/inventory/reports/stock-card?warehouseId=${filters.warehouseId}&materialItemId=${filters.materialItemId}&fromDate=${filters.fromDate}&toDate=${filters.toDate}`;
      if (filters.projectId) url += `&projectId=${filters.projectId}`;
      if (filters.wbsId) url += `&wbsId=${filters.wbsId}`;
      const res = await fetch(url);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!filters?.warehouseId && !!filters?.materialItemId
  });

  const handleExportCsv = () => {
    if (!filters?.warehouseId || !filters?.materialItemId) return;
    let url = `/api/export/inventory/stock-card?warehouseId=${filters.warehouseId}&materialItemId=${filters.materialItemId}&fromDate=${filters.fromDate}&toDate=${filters.toDate}`;
    if (filters.projectId) url += `&projectId=${filters.projectId}`;
    window.open(url, '_blank');
  };

  if (!filters?.warehouseId || !filters?.materialItemId) {
    return <div className="p-8 text-center text-zinc-500 italic bg-zinc-900/10 rounded-xl border border-zinc-800/40">Vui lòng chọn Kho và Vật tư sau đó bấm &quot;Chạy báo cáo&quot;.</div>;
  }
  if (isLoading) return <div className="flex flex-col gap-3">{[1,2,3].map(i => <div key={i} className="h-12 w-full animate-pulse bg-zinc-800/40 rounded-lg" />)}</div>;
  if (error || !reportRes) return <div className="p-4 rounded bg-red-950/20 border border-red-900/50 text-red-400">Lỗi khi chạy báo cáo Thẻ kho.</div>;

  const report = reportRes;
  const totalInQty = report.lines?.reduce((s: number, l: any) => s + (l.inputQuantity || 0), 0) || 0;
  const totalInAmt = report.lines?.reduce((s: number, l: any) => s + (l.inputAmount || 0), 0) || 0;
  const totalOutQty = report.lines?.reduce((s: number, l: any) => s + (l.outputQuantity || 0), 0) || 0;
  const totalOutAmt = report.lines?.reduce((s: number, l: any) => s + (l.outputAmount || 0), 0) || 0;

  return (
    <div className="space-y-4 bg-zinc-900/30 p-5 rounded-xl border border-zinc-800/80">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">THẺ KHO CHI TIẾT VẬT TƯ</h3>
          <p className="text-[10px] text-zinc-400 mt-1 uppercase tracking-widest font-semibold">Kỳ: {new Date(filters.fromDate).toLocaleDateString('vi-VN')} - {new Date(filters.toDate).toLocaleDateString('vi-VN')}</p>
        </div>
        <button onClick={handleExportCsv} className="px-4 py-2 text-xs font-bold rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700">Xuất CSV</button>
      </div>
      <div className="overflow-x-auto rounded-lg border border-zinc-800">
        <table className="w-full text-xs text-left border-collapse min-w-[900px]">
          <thead className="bg-zinc-900 border-b border-zinc-800 text-zinc-400 font-bold uppercase tracking-wider">
            <tr><th className="p-2">Ngày</th><th className="p-2">Loại CT</th><th className="p-2">Số CT</th><th className="p-2">Diễn giải</th><th className="p-2 text-right">Nhập SL</th><th className="p-2 text-right">Nhập GT</th><th className="p-2 text-right">Xuất SL</th><th className="p-2 text-right">Xuất GT</th><th className="p-2 text-right">Tồn SL</th><th className="p-2 text-right">ĐG BQ</th></tr>
          </thead>
          <tbody className="divide-y divide-zinc-800 text-zinc-200">
            <tr className="bg-zinc-800/30 text-zinc-400 italic">
              <td className="p-2 font-mono">{new Date(filters.fromDate).toLocaleDateString('vi-VN')}</td>
              <td className="p-2">DƯ ĐẦU KỲ</td><td className="p-2">-</td><td className="p-2">Số dư đầu kỳ</td>
              <td className="p-2 text-right">-</td><td className="p-2 text-right">-</td><td className="p-2 text-right">-</td><td className="p-2 text-right">-</td>
              <td className="p-2 text-right font-mono font-semibold text-white">{report.openingQuantity?.toLocaleString('vi-VN')}</td>
              <td className="p-2 text-right font-mono">{report.openingAvgCost?.toLocaleString('vi-VN')} đ</td>
            </tr>
            {report.lines?.map((line: any, idx: number) => (
              <tr key={idx} className="hover:bg-zinc-800/20">
                <td className="p-2 font-mono">{new Date(line.movementDate).toLocaleDateString('vi-VN')}</td>
                <td className="p-2">{line.documentType}</td>
                <td className="p-2"><span className="font-bold text-blue-400 cursor-pointer hover:underline" onClick={() => onDrillDown(line.documentNo)}>{line.documentNo}</span></td>
                <td className="p-2 max-w-[150px] truncate">{line.description}</td>
                <td className="p-2 text-right font-mono text-emerald-400">{line.inputQuantity > 0 ? line.inputQuantity.toLocaleString('vi-VN') : '-'}</td>
                <td className="p-2 text-right font-mono text-emerald-500">{line.inputAmount > 0 ? `${line.inputAmount.toLocaleString('vi-VN')} đ` : '-'}</td>
                <td className="p-2 text-right font-mono text-orange-400">{line.outputQuantity > 0 ? line.outputQuantity.toLocaleString('vi-VN') : '-'}</td>
                <td className="p-2 text-right font-mono text-orange-500">{line.outputAmount > 0 ? `${line.outputAmount.toLocaleString('vi-VN')} đ` : '-'}</td>
                <td className="p-2 text-right font-mono font-semibold">{line.runningQuantity?.toLocaleString('vi-VN')}</td>
                <td className="p-2 text-right font-mono text-zinc-400">{line.runningAvgCost?.toLocaleString('vi-VN')} đ</td>
              </tr>
            ))}
            <tr className="bg-zinc-900 font-black text-white">
              <td className="p-2" colSpan={4}>TỔNG PHÁT SINH</td>
              <td className="p-2 text-right font-mono text-emerald-400">{totalInQty.toLocaleString('vi-VN')}</td>
              <td className="p-2 text-right font-mono text-emerald-500">{totalInAmt.toLocaleString('vi-VN')} đ</td>
              <td className="p-2 text-right font-mono text-orange-400">{totalOutQty.toLocaleString('vi-VN')}</td>
              <td className="p-2 text-right font-mono text-orange-500">{totalOutAmt.toLocaleString('vi-VN')} đ</td>
              <td className="p-2 text-right font-mono text-blue-400">{report.closingQuantity?.toLocaleString('vi-VN')}</td>
              <td className="p-2 text-right font-mono text-blue-400">{report.closingAvgCost?.toLocaleString('vi-VN')} đ</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
