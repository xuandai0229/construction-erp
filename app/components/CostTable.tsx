'use client';

import { costType_LABELS, CostRecord } from '@/app/types';
import { formatDate, formatVnd } from './dashboard-data';
import { useERPStore } from '@/store/erpStore';
import { TableVirtuoso } from 'react-virtuoso';
import { useDeleteCostMutation } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';

export default function CostTable({ costs, onEdit }: { costs: CostRecord[], onEdit: (c: CostRecord) => void }) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbs = wbsData?.flat || [];
  const { mutate: deleteCost } = useDeleteCostMutation(currentProjectId);

  const getWBSName = (id: string) => (wbs as any[]).find((w: any) => w.id === id)?.name || '—';

  const handleDelete = (id: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bản ghi chi phí này?')) {
      deleteCost(id);
    }
  };

  return (
    <div className="card-elevation overflow-hidden border border-[var(--border)]">
      <div className="overflow-x-auto scrollbar-hide">
        {costs.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
            Không có dữ liệu chi phí
          </div>
        ) : (
          <TableVirtuoso
            useWindowScroll
            data={costs}
            components={{
              Table: (props) => <table {...props} className="erp-table w-full min-w-[800px]" />,
              TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
              TableRow: (props) => <tr {...props} className="group hover:bg-[var(--secondary)] transition-colors" />
            }}
            fixedHeaderContent={() => (
              <tr>
                <th className="w-[90px] bg-[var(--table-head-bg)]">Ngày</th>
                <th className="min-w-[180px] bg-[var(--table-head-bg)]">Nội dung</th>
                <th className="min-w-[130px] bg-[var(--table-head-bg)]">Hạng mục</th>
                <th className="w-[80px] bg-[var(--table-head-bg)]">Loại</th>
                <th className="w-[130px] text-right bg-[var(--table-head-bg)]">Số tiền</th>
                <th className="w-[90px] text-center bg-[var(--table-head-bg)]">Trạng thái</th>
                <th className="w-[80px] text-center bg-[var(--table-head-bg)]">Thao tác</th>
              </tr>
            )}
            itemContent={(i, cost) => (
              <>
                {/* Date */}
                <td className="whitespace-nowrap text-[12px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-accent)] transition-colors">
                  {formatDate(cost.date)}
                </td>

                {/* Description + Supplier */}
                <td>
                  <div className="font-bold text-[var(--text-primary)] truncate max-w-[200px]" title={cost.note ?? ''}>
                    {cost.note ?? 'Chi phí không tên'}
                  </div>
                  <div className="text-[10px] font-semibold text-[var(--text-muted)] uppercase truncate max-w-[200px] mt-0.5">
                    {cost.supplier || 'Nhiều nhà CC'}
                  </div>
                </td>

                {/* WBS */}
                <td>
                  <div className="text-[12px] font-semibold text-[var(--text-secondary)] truncate max-w-[160px]" title={getWBSName(cost.wbsId)}>
                    {getWBSName(cost.wbsId)}
                  </div>
                </td>

                {/* Cost Type Badge */}
                <td>
                  <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)] group-hover:border-[var(--text-accent)]/20 group-hover:text-[var(--text-accent)] transition-all">
                    {costType_LABELS[cost.costType] || cost.costType}
                  </span>
                </td>

                {/* Amount */}
                <td className="text-right tabular-nums font-black text-[var(--text-primary)] group-hover:text-[var(--text-accent)] transition-colors whitespace-nowrap">
                  {formatVnd(cost.amount)}
                </td>

                {/* Status Badge */}
                <td className="text-center">
                  <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-wide ${
                    cost.status === 'paid'
                      ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/25'
                      : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/25'
                  }`}>
                    <span className={`h-1 w-1 rounded-full shrink-0 ${
                      cost.status === 'paid'
                        ? 'bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]'
                        : 'bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)]'
                    }`} />
                    {cost.status === 'paid' ? 'Đã trả' : 'Nợ'}
                  </span>
                </td>

                {/* Actions */}
                <td className="text-center">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 translate-x-1.5 group-hover:translate-x-0 transition-all duration-200">
                    <button
                      onClick={() => onEdit(cost)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--text-muted)] hover:text-white hover:bg-blue-600 transition-all border border-[var(--border)]"
                      title="Chỉnh sửa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(cost.id)}
                      className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--text-muted)] hover:text-white hover:bg-rose-600 transition-all border border-[var(--border)]"
                      title="Xóa"
                    >
                      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </td>
              </>
            )}
          />
        )}
      </div>
    </div>
  );
}
