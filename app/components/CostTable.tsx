'use client';

import { costType_LABELS, CostRecord } from '@/app/types';
import { formatDate, formatVnd } from './dashboard-data';
import { COL_WIDTHS } from '@/app/utils/table-constants';
import { useERPStore } from '@/store/erpStore';
import { TableVirtuoso } from 'react-virtuoso';
import { useDeleteCostMutation, useTransitionCostMutation } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useState, useEffect, useRef } from 'react';
import ConfirmModal from '@/app/components/modals/ConfirmModal';

import { useTableUX } from '@/app/hooks/useTableUX';

export default function CostTable({ costs, onEdit }: { costs: CostRecord[], onEdit: (c: CostRecord) => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_VISIBLE_COUNT = 5;
  const visibleCosts = isExpanded ? costs : costs.slice(0, INITIAL_VISIBLE_COUNT);
  const hasMore = costs.length > INITIAL_VISIBLE_COUNT;
  const { scrollContainerRef, showScrollHint, dragCursorClass } = useTableUX();
  const containerRef = useRef<HTMLDivElement>(null);

  // Micro-nudge animation for scroll discoverability on first render
  useEffect(() => {
    if (!scrollContainerRef?.current) return;
    const el = scrollContainerRef.current;

    // Only trigger if there's actual overflow
    if (el.scrollWidth <= el.clientWidth) return;

    // Delay slightly to ensure DOM is fully rendered
    const timer = setTimeout(() => {
      el.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
      el.style.transform = 'translateX(12px)';

      setTimeout(() => {
        el.style.transform = 'translateX(0)';
        // Remove transition after animation
        setTimeout(() => {
          el.style.transition = '';
        }, 500);
      }, 500);
    }, 900);

    return () => clearTimeout(timer);
  }, [scrollContainerRef]);

  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const wbs = wbsData?.flat || [];

  const { mutateAsync: deleteCost } = useDeleteCostMutation(currentProjectId);
  const { mutateAsync: transitionCost } = useTransitionCostMutation(currentProjectId);

  const [confirmAction, setConfirmAction] = useState<{ id: string, type: 'DELETE' | 'LOCKED' } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const getWBSName = (id: string) => wbs.find((w: { id: string, name: string }) => w.id === id)?.name || '—';

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
    } catch (err: unknown) {
      const error = err as { metadata?: { isFinancialLocked: boolean }, message?: string };
      if (error.metadata?.isFinancialLocked) {
        setConfirmAction(prev => prev ? { ...prev, type: 'LOCKED' } : null);
      } else {
        alert(error.message || "Lỗi thao tác chi phí.");
        setConfirmAction(null);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="flex flex-col">
        <div ref={containerRef} className="card-elevation border border-[var(--border)] rounded-lg bg-[var(--card)] relative shadow-sm" style={{
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), inset 0 0.5px 0 rgba(255, 255, 255, 0.05)'
        }}>
          <div
            ref={scrollContainerRef}
            className={`overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent hover:scrollbar-thumb-[var(--text-muted)] transition-colors duration-200 ${dragCursorClass}`}
            style={{
              scrollBehavior: 'smooth',
            }}
          >
            {/* Gradient fade hint - subtle theme-aware style */}
            {showScrollHint && (
              <div className="absolute right-0 top-0 bottom-0 w-12 pointer-events-none z-20"
                style={{
                  background: 'linear-gradient(to left, var(--card) 0%, transparent 100%)',
                  opacity: 0.9
                }}
              />
            )}
            {costs.length === 0 ? (
              <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Không có dữ liệu chi phí
              </div>
            ) : (
              <TableVirtuoso
                useWindowScroll
                data={visibleCosts}
                components={{
                  Table: (props) => <table {...props} className="erp-table w-full min-w-[800px] table-fixed" />,
                  TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
                  TableRow: (props) => <tr {...props} className="group erp-table-row select-none" />
                }}
                fixedHeaderContent={() => (
                  <tr className="bg-[var(--table-head-bg)]">
                    <th className={`${COL_WIDTHS.DATE} py-3 px-5 text-left bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] font-black tracking-[0.2em] text-[var(--text-secondary)] border-r border-[var(--border)]`}>Ngày</th>
                    <th className="w-[280px] py-3 px-5 text-left bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] font-black tracking-[0.2em] text-[var(--text-secondary)] border-r border-[var(--border)]">Nội dung / Nhà cung cấp</th>
                    <th className="w-[200px] py-3 px-5 text-left bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] font-black tracking-[0.2em] text-[var(--text-secondary)] border-r border-[var(--border)]">Hạng mục WBS</th>
                    <th className={`${COL_WIDTHS.STATUS} py-3 px-5 text-left bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] font-black tracking-[0.2em] text-[var(--text-secondary)] border-r border-[var(--border)]`}>Phân loại</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} py-3 px-5 text-right bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] font-black tracking-[0.2em] text-[var(--text-secondary)] border-r border-[var(--border)]`}>Số tiền</th>
                    <th className={`${COL_WIDTHS.STATUS} py-3 px-5 text-center bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] font-black tracking-[0.2em] text-[var(--text-secondary)] border-r border-[var(--border)]`}>Trạng thái</th>
                    <th className={`${COL_WIDTHS.ACTIONS} py-3 px-5 text-center bg-[var(--table-head-bg)] whitespace-nowrap uppercase text-[10px] font-black tracking-[0.2em] text-[var(--text-secondary)]`}>Nghiệp vụ</th>
                  </tr>
                )}
                itemContent={(i, cost) => (
                  <>
                    {/* Date */}
                    <td className={`whitespace-nowrap py-2.5 px-5 text-[11.5px] font-bold text-[var(--text-tertiary)] group-hover:text-blue-500 transition-colors border-r border-[var(--border)] ${COL_WIDTHS.DATE}`}>
                      {formatDate(cost.date)}
                    </td>

                    {/* Description + Supplier */}
                    <td className="w-[280px] py-2.5 px-5 border-r border-[var(--border)]">
                      <div className="font-bold text-[var(--text-primary)] text-[12px] truncate leading-tight mb-0.5" title={cost.note ?? ''}>
                        {cost.note ?? 'Chi phí không tên'}
                      </div>
                      <div className="text-[9.5px] font-extrabold text-[var(--text-tertiary)] uppercase tracking-wider truncate opacity-70">
                        {cost.supplier || 'Nhiều nhà CC'}
                      </div>
                    </td>

                    {/* WBS */}
                    <td className="w-[200px] py-2.5 px-5 border-r border-[var(--border)]">
                      <div className="text-[11.5px] font-bold text-[var(--text-secondary)] truncate" title={getWBSName(cost.wbsId)}>
                        {getWBSName(cost.wbsId)}
                      </div>
                    </td>

                    {/* Cost Type Badge */}
                    <td className={`${COL_WIDTHS.STATUS} py-2.5 px-5 border-r border-[var(--border)]`}>
                      <span className="inline-flex items-center whitespace-nowrap rounded-lg px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[var(--secondary)] text-[var(--text-tertiary)] border border-[var(--border)] group-hover:border-blue-500/20 group-hover:text-blue-500 transition-all">
                        {costType_LABELS[cost.costType] || cost.costType}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className={`${COL_WIDTHS.FINANCIAL} py-2.5 px-5 text-right tabular-nums font-black text-[var(--text-primary)] text-[12px] group-hover:text-blue-500 transition-colors whitespace-nowrap border-r border-[var(--border)]`}>
                      {formatVnd(cost.amount)}
                    </td>

                    {/* Status Badge */}
                    <td className={`${COL_WIDTHS.STATUS} py-2.5 px-5 text-center border-r border-[var(--border)]`}>
                      <span className={`inline-flex items-center gap-2 rounded-xl px-3 py-1 text-[9.5px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shadow-sm ${cost.workflowStatus === 'POSTED' || cost.approvalStatus === 'APPROVED'
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30 shadow-emerald-500/5'
                        : cost.workflowStatus === 'REVERSED' || cost.workflowStatus === 'REJECTED'
                          ? 'bg-rose-500/10 text-rose-500 border-rose-500/30 shadow-rose-500/5'
                          : 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-amber-500/5'
                        }`}>
                        <span className={`h-1.5 w-1.5 rounded-full shrink-0 shadow-sm ${cost.workflowStatus === 'POSTED' || cost.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-500 shadow-emerald-500/40'
                          : cost.workflowStatus === 'REVERSED' || cost.workflowStatus === 'REJECTED'
                            ? 'bg-rose-500 shadow-rose-500/40'
                            : 'bg-amber-500 shadow-amber-500/40'
                          }`} />
                        {cost.workflowStatus === 'POSTED' ? 'Ghi sổ' : cost.approvalStatus === 'APPROVED' ? 'Đã duyệt' : cost.workflowStatus === 'REVERSED' ? 'Đã hủy' : 'Nháp'}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className={`${COL_WIDTHS.ACTIONS} py-2.5 px-5 text-center`}>
                      <div className="flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300">
                        <button
                          onClick={() => onEdit(cost)}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-tertiary)] hover:text-white hover:bg-blue-600 transition-all border border-[var(--border)] shadow-sm"
                          title="Hiệu chỉnh"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => setConfirmAction({ id: cost.id, type: 'DELETE' })}
                          className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--secondary)] text-[var(--text-tertiary)] hover:text-white hover:bg-rose-600 transition-all border border-[var(--border)] shadow-sm"
                          title="Hủy / Xóa"
                        >
                          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
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

        {hasMore && (
          <div className="flex justify-center border-t border-[var(--border)] bg-[var(--secondary)]/10">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 py-3.5 w-full justify-center text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-tertiary)] hover:text-blue-500 hover:bg-blue-500/5 transition-all duration-300 group"
            >
              {isExpanded ? (
                <>
                  <svg viewBox="0 0 24 24" className="h-3 w-3 group-hover:-translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m18 15-6-6-6 6" /></svg>
                  Thu gọn danh sách
                </>
              ) : (
                <>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-transform" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m6 9 6 6 6-6" /></svg>
                  + {costs.length - INITIAL_VISIBLE_COUNT} XEM THÊM
                </>
              )}
            </button>
          </div>
        )}
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
