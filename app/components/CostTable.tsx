'use client';

import { costType_LABELS, CostRecord } from '@/app/types';
import { formatDate, formatVnd } from './dashboard-data';
import { COL_WIDTHS, FINANCIAL_CELL_CLASS } from '@/app/utils/table-constants';
import { useERPStore } from '@/store/erpStore';
import { TableVirtuoso } from 'react-virtuoso';
import { useDeleteCostMutation, useTransitionCostMutation } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useState } from 'react';
import ConfirmModal from '@/app/components/modals/ConfirmModal';

export default function CostTable({ costs, onEdit }: { costs: CostRecord[], onEdit: (c: CostRecord) => void }) {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbs = wbsData?.flat || [];
  
  const { mutateAsync: deleteCost } = useDeleteCostMutation(currentProjectId);
  const { mutateAsync: transitionCost } = useTransitionCostMutation(currentProjectId);

  const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'DELETE' | 'LOCKED' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getWBSName = (id: string) => (wbs as any[]).find((w: any) => w.id === id)?.name || '—';

  const executeAction = async () => {
    if (!confirmAction) return;
    setIsProcessing(true);
    try {
      if (confirmAction.type === 'DELETE') {
        await deleteCost(confirmAction.id);
      } else if (confirmAction.type === 'LOCKED') {
        await transitionCost({ id: confirmAction.id, status: 'REVERSED' });
      }
      setConfirmAction(null);
    } catch (err: any) {
      if (err.metadata?.isFinancialLocked) {
        setConfirmAction(prev => prev ? { ...prev, type: 'LOCKED' } : null);
      } else {
        alert(err.message || "Lỗi thao tác chi phí.");
        setConfirmAction(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
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
                TableRow: (props) => <tr {...props} className="group erp-table-row" />
              }}
              fixedHeaderContent={() => (
                <tr className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)]">
                  <th className={`${COL_WIDTHS.DATE} py-2 text-left bg-[var(--table-head-bg)] whitespace-nowrap`}>Ngày</th>
                  <th className={`${COL_WIDTHS.NAME_WBS} py-2 text-left bg-[var(--table-head-bg)] whitespace-nowrap`}>Mô tả / Đội CC</th>
                  <th className={`${COL_WIDTHS.NAME_WBS} py-2 text-left bg-[var(--table-head-bg)] whitespace-nowrap`}>Hạng mục WBS</th>
                  <th className={`${COL_WIDTHS.STATUS} py-2 text-left bg-[var(--table-head-bg)] whitespace-nowrap`}>Loại</th>
                  <th className={`${COL_WIDTHS.FINANCIAL} py-2 text-right bg-[var(--table-head-bg)] whitespace-nowrap`}>Số tiền</th>
                  <th className="w-[100px] py-2 text-center bg-[var(--table-head-bg)] whitespace-nowrap">Thao tác</th>
                </tr>
              )}
              itemContent={(i, cost) => (
                <>
                  {/* Date */}
                  <td className={`whitespace-nowrap py-2 text-[11px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-accent)] transition-colors ${COL_WIDTHS.DATE}`}>
                    {formatDate(cost.date)}
                  </td>

                  {/* Description + Supplier */}
                  <td className="py-2">
                    <div className="font-bold text-[var(--text-primary)] text-[11px] truncate max-w-[200px]" title={cost.note ?? ''}>
                      {cost.note ?? 'Chi phí không tên'}
                    </div>
                    <div className="text-[9px] font-bold text-[var(--text-muted)] uppercase truncate max-w-[200px]">
                      {cost.supplier || 'Nhiều nhà CC'}
                    </div>
                  </td>

                  {/* WBS */}
                  <td className="py-2">
                    <div className="text-[11px] font-bold text-[var(--text-secondary)] truncate max-w-[160px]" title={getWBSName(cost.wbsId)}>
                      {getWBSName(cost.wbsId)}
                    </div>
                  </td>

                  {/* Cost Type Badge */}
                  <td className="py-2">
                    <span className="inline-flex items-center whitespace-nowrap rounded-md px-1.5 py-0 text-[8px] font-black uppercase tracking-wider bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)] group-hover:border-[var(--text-accent)]/20 group-hover:text-[var(--text-accent)] transition-all">
                      {costType_LABELS[cost.costType] || cost.costType}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="py-2 text-right tabular-nums font-black text-[var(--text-primary)] text-[11px] group-hover:text-[var(--text-accent)] transition-colors whitespace-nowrap">
                    {formatVnd(cost.amount)}
                  </td>

                  {/* Status Badge */}
                  <td className="py-2 text-center">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[8px] font-black uppercase tracking-wide ${
                      cost.workflowStatus === 'POSTED' || cost.approvalStatus === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/25'
                        : cost.workflowStatus === 'REVERSED' || cost.workflowStatus === 'REJECTED'
                        ? 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/25'
                        : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/25'
                    }`}>
                      <span className={`h-1 w-1 rounded-full shrink-0 ${
                        cost.workflowStatus === 'POSTED' || cost.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-500'
                          : cost.workflowStatus === 'REVERSED' || cost.workflowStatus === 'REJECTED'
                          ? 'bg-rose-500'
                          : 'bg-amber-500'
                      }`} />
                      {cost.workflowStatus === 'POSTED' ? 'Ghi sổ' : cost.approvalStatus === 'APPROVED' ? 'Đã duyệt' : cost.workflowStatus === 'REVERSED' ? 'Đã hủy' : 'Nháp'}
                    </span>
                  </td>

                  {/* Actions */}
                  <td className="py-2 text-center">
                    <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-all duration-200">
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
                        onClick={() => setConfirmAction({ id: cost.id, type: 'DELETE' })}
                        className="flex h-7 w-7 items-center justify-center rounded-lg bg-[var(--secondary)] text-[var(--text-muted)] hover:text-white hover:bg-rose-600 transition-all border border-[var(--border)]"
                        title="Xóa / Hủy"
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

      <ConfirmModal
        isOpen={!!confirmAction}
        onClose={() => setConfirmAction(null)}
        onConfirm={executeAction}
        isLoading={isProcessing}
        title={confirmAction?.type === 'LOCKED' ? "CHỨNG TỪ ĐÃ GHI SỔ" : "Xác nhận xóa vĩnh viễn"}
        message={
          confirmAction?.type === 'LOCKED' 
          ? `Hệ thống phát hiện chi phí này đã được phê duyệt và ghi nhận vào sổ cái kế toán. Bạn không thể xóa vật lý chứng từ này. Bạn có muốn thực hiện lệnh "Hoàn Bút Toán" (Hủy ghi nhận) để đảo ngược chi phí thay vì xóa không?`
          : `Bạn có chắc chắn muốn xóa vĩnh viễn bản nháp chi phí này? Hành động này không thể hoàn tác.`
        }
        variant={confirmAction?.type === 'LOCKED' ? 'archive' : 'danger'}
        confirmLabel={confirmAction?.type === 'LOCKED' ? "Hoàn bút toán" : "Xóa vĩnh viễn"}
        businessContext={confirmAction?.type === 'LOCKED' ? "Hoàn bút toán sẽ sinh ra một giao dịch đảo ngược (Reverse Journal) để đảm bảo toàn vẹn dữ liệu cho công tác kiểm toán." : undefined}
      />
    </>
  );
}
