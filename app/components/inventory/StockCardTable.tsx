'use client';

import { useQuery } from '@tanstack/react-query';
import { 
  EnterpriseEmptyState,
  EnterpriseLoadingState,
  EnterpriseErrorState,
  EnterpriseDataTable,
  EnterpriseColumn
} from '@/app/components/ui-enterprise';

interface StockCardTableProps {
  filters: { warehouseId?: string; materialItemId?: string; projectId?: string; wbsId?: string; fromDate: string; toDate: string; } | null;
  onDrillDown: (docNo: string) => void;
}

export function StockCardTable({ filters, onDrillDown }: StockCardTableProps) {
  const { data: reportRes, isLoading, error, refetch } = useQuery({
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
    return (
      <div className="p-8 text-center text-[var(--text-secondary)] bg-[var(--secondary)] rounded-xl border border-[var(--border)] text-[12px] italic">
        Vui lòng chọn Kho và Vật tư sau đó bấm &quot;Chạy báo cáo&quot;.
      </div>
    );
  }

  if (isLoading) {
    return <EnterpriseLoadingState message="Đang kết xuất Thẻ kho chi tiết vật tư..." />;
  }

  if (error || !reportRes) {
    return (
      <EnterpriseErrorState
        title="Lỗi tải dữ liệu"
        description="Không thể kết xuất dữ liệu Thẻ kho từ hệ thống Sổ kho."
        onRetry={refetch}
      />
    );
  }

  const report = reportRes;
  const totalInQty = report.lines?.reduce((s: number, l: any) => s + (l.inputQuantity || 0), 0) || 0;
  const totalInAmt = report.lines?.reduce((s: number, l: any) => s + (l.inputAmount || 0), 0) || 0;
  const totalOutQty = report.lines?.reduce((s: number, l: any) => s + (l.outputQuantity || 0), 0) || 0;
  const totalOutAmt = report.lines?.reduce((s: number, l: any) => s + (l.outputAmount || 0), 0) || 0;

  const dataLines = [
    {
      movementDate: filters.fromDate,
      documentType: 'DƯ ĐẦU KỲ',
      documentNo: '-',
      description: 'Số dư đầu kỳ phát sinh trước báo cáo',
      inputQuantity: 0,
      inputAmount: 0,
      outputQuantity: 0,
      outputAmount: 0,
      runningQuantity: report.openingQuantity,
      runningAvgCost: report.openingAvgCost,
      isOpeningRow: true
    },
    ...(report.lines || [])
  ];

  const columns: EnterpriseColumn<any>[] = [
    { key: 'movementDate', header: 'Ngày', render: row => <span className="font-mono">{new Date(row.movementDate).toLocaleDateString('vi-VN')}</span>, width: '100px', align: 'center' },
    { key: 'documentType', header: 'Loại CT', render: row => row.isOpeningRow ? <span className="italic text-[var(--text-muted)] font-bold">{row.documentType}</span> : row.documentType, width: '130px' },
    { key: 'documentNo', header: 'Số CT', render: row => row.isOpeningRow ? '-' : <span className="font-bold text-[var(--primary)] cursor-pointer hover:underline" onClick={() => onDrillDown(row.documentNo)}>{row.documentNo}</span>, width: '130px' },
    { key: 'description', header: 'Diễn giải', render: row => row.description, minWidth: '180px', truncate: true },
    
    { key: 'inputQuantity', header: 'Nhập SL', render: row => row.isOpeningRow || row.inputQuantity === 0 ? '-' : row.inputQuantity.toLocaleString('vi-VN'), width: '95px', align: 'right', className: 'text-emerald-500 font-bold' },
    { key: 'inputAmount', header: 'Nhập GT', render: row => row.isOpeningRow || row.inputAmount === 0 ? '-' : `${row.inputAmount.toLocaleString('vi-VN')} đ`, width: '120px', align: 'right', className: 'text-emerald-500 font-bold' },
    
    { key: 'outputQuantity', header: 'Xuất SL', render: row => row.isOpeningRow || row.outputQuantity === 0 ? '-' : row.outputQuantity.toLocaleString('vi-VN'), width: '95px', align: 'right', className: 'text-rose-500 font-bold' },
    { key: 'outputAmount', header: 'Xuất GT', render: row => row.isOpeningRow || row.outputAmount === 0 ? '-' : `${row.outputAmount.toLocaleString('vi-VN')} đ`, width: '120px', align: 'right', className: 'text-rose-500 font-bold' },
    
    { key: 'runningQuantity', header: 'Tồn SL', render: row => row.runningQuantity?.toLocaleString('vi-VN'), width: '100px', align: 'right', className: 'font-semibold text-[var(--text-primary)]' },
    { key: 'runningAvgCost', header: 'ĐG BQ', render: row => `${row.runningAvgCost?.toLocaleString('vi-VN')} đ`, width: '130px', align: 'right', className: 'text-[var(--text-muted)] font-mono' }
  ];

  const footerElement = (
    <tr className="bg-[var(--secondary)] border-t border-[var(--border)] font-bold text-[var(--text-primary)] h-[40px] text-[11px]">
      <td className="px-4 py-2" colSpan={4}>TỔNG PHÁT SINH TRONG KỲ</td>
      <td className="px-4 py-2 text-right font-mono text-emerald-500">{totalInQty.toLocaleString('vi-VN')}</td>
      <td className="px-4 py-2 text-right font-mono text-emerald-500">{totalInAmt.toLocaleString('vi-VN')} đ</td>
      <td className="px-4 py-2 text-right font-mono text-rose-500">{totalOutQty.toLocaleString('vi-VN')}</td>
      <td className="px-4 py-2 text-right font-mono text-rose-500">{totalOutAmt.toLocaleString('vi-VN')} đ</td>
      <td className="px-4 py-2 text-right font-mono text-[var(--primary)]">{report.closingQuantity?.toLocaleString('vi-VN')}</td>
      <td className="px-4 py-2 text-right font-mono text-[var(--primary)]">{report.closingAvgCost?.toLocaleString('vi-VN')} đ</td>
    </tr>
  );

  return (
    <div className="space-y-4 bg-[var(--card)] p-5 rounded-xl border border-[var(--border)]">
      <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
        <div>
          <h3 className="text-sm font-black text-[var(--text-primary)] uppercase tracking-wider">
            THẺ KHO CHI TIẾT VẬT TƯ (STOCK CARD DETAIL)
          </h3>
          <p className="text-[10px] text-[var(--text-muted)] mt-1 uppercase tracking-widest font-semibold">
            Kỳ: {new Date(filters.fromDate).toLocaleDateString('vi-VN')} - {new Date(filters.toDate).toLocaleDateString('vi-VN')}
          </p>
        </div>
        <button
          onClick={handleExportCsv}
          className="px-4 py-2 text-xs font-bold rounded-lg bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 text-[var(--text-primary)] border border-[var(--border)] transition-colors cursor-pointer"
        >
          Xuất CSV
        </button>
      </div>

      <EnterpriseDataTable
        data={dataLines}
        columns={columns}
        getRowKey={(row, idx) => idx}
        minWidth="1100px"
        footer={footerElement}
        rowClassName={(row) => row.isOpeningRow ? 'bg-[var(--secondary)]/20' : ''}
      />
    </div>
  );
}
