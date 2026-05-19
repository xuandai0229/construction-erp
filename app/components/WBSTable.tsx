import React, { useState } from 'react';
import { WBSBudgetRow, formatVnd } from './dashboard-data';
import { COL_WIDTHS, FINANCIAL_CELL_CLASS } from '@/app/utils/table-constants';
import { useTableUX } from '@/app/hooks/useTableUX';

export default function WBSTable({ data }: { data: WBSBudgetRow[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_VISIBLE_COUNT = 5;
  const { scrollContainerRef, showScrollHint, dragCursorClass } = useTableUX();

  const renderRows = (items: WBSBudgetRow[], level = 0, state = { count: 0 }): React.ReactNode => {
    return items.map((item) => {
      if (!isExpanded && state.count >= INITIAL_VISIBLE_COUNT) return null;
      state.count++;

      const percentage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
      const isOverBudget = percentage > 100;

      return (
        <React.Fragment key={item.id}>
          <tr className="erp-table-row group even:bg-[var(--divider)]/10 border-b border-[var(--border)] last:border-b-0 select-none">
            {/* WBS Name */}
            <td className="w-[320px] py-2.5 px-4 border-r border-[var(--border)]">
              <div className="flex items-center gap-2.5" style={{ paddingLeft: `${level * 16}px` }}>
                {item.children.length > 0 && (
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0 text-[var(--text-tertiary)] group-hover:text-blue-500 transition-executive" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                <span className={`font-black truncate tracking-tight transition-executive ${level === 0 ? 'text-blue-500 text-[11.5px]' : 'text-[var(--text-secondary)] text-[11px] group-hover:text-[var(--text-primary)]'}`} title={item.name}>
                  {item.name}
                </span>
              </div>
            </td>

            <td className={`${COL_WIDTHS.FINANCIAL} text-right py-2.5 px-4 ${FINANCIAL_CELL_CLASS} text-[11.5px] text-[var(--text-tertiary)] font-bold tabular-nums whitespace-nowrap border-r border-[var(--border)] transition-executive`}>
              {formatVnd(item.budget)}
            </td>
            <td className={`${COL_WIDTHS.FINANCIAL} text-right py-2.5 px-4 ${FINANCIAL_CELL_CLASS} text-[11.5px] text-[var(--text-primary)] font-bold tabular-nums group-hover:text-blue-500 transition-executive whitespace-nowrap border-r border-[var(--border)]`}>
              {formatVnd(item.actual)}
            </td>
            <td className={`${COL_WIDTHS.FINANCIAL} text-right py-2.5 px-4 ${FINANCIAL_CELL_CLASS} text-[11.5px] font-black tabular-nums whitespace-nowrap border-r border-[var(--border)] transition-executive ${item.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {item.profit >= 0 ? '+' : ''}{formatVnd(item.profit)}
            </td>

            {/* Progress bar */}
            <td className={`${COL_WIDTHS.PROGRESS} text-center py-2.5 px-4`}>
              <div className="flex flex-col items-center gap-1">
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--secondary)] border border-[var(--border)]/15 transition-executive">
                  <div
                    className={`h-full rounded-full progress-fill ${isOverBudget
                      ? 'bg-gradient-to-r from-rose-600 to-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.3)]'
                      : 'bg-gradient-to-r from-blue-600 to-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.3)]'
                      }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <span className={`text-[9px] font-extrabold tracking-widest uppercase transition-executive ${isOverBudget ? 'text-rose-500 pulse-subtle' : 'text-[var(--text-tertiary)]'}`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </td>
          </tr>
          {item.children.length > 0 && renderRows(item.children, level + 1, state)}
        </React.Fragment>
      );
    });
  };

  const countAllRows = (items: WBSBudgetRow[]): number => {
    return items.reduce((acc, item) => acc + 1 + countAllRows(item.children), 0);
  };
  const totalRows = countAllRows(data);
  const hasMore = totalRows > INITIAL_VISIBLE_COUNT;

  return (
    <div className="flex flex-col border border-[var(--border)] rounded-xl overflow-hidden bg-[var(--card)]/30 backdrop-blur-sm">
      <div className={`scroll-hint-container ${showScrollHint ? 'scroll-hint-right' : ''}`}>
        <div
          ref={scrollContainerRef}
          className={`overflow-x-auto scrollbar-thin scrollbar-thumb-[var(--border)] scrollbar-track-transparent ${dragCursorClass}`}
        >
          {showScrollHint && (
            <div className="scroll-hint-icon" title="Cuộn ngang để xem thêm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
            </div>
          )}
          <table className="erp-table w-full table-fixed min-w-[800px]">
            <thead>
              <tr className="bg-[var(--table-head-bg)] border-b border-[var(--border)] h-9">
                <th className="w-[320px] text-left px-4 py-2 uppercase text-[10px] tracking-[0.15em] text-[var(--text-tertiary)] font-black border-r border-[var(--border)]">Hạng mục thi công (WBS)</th>
                <th className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-2 uppercase text-[10px] tracking-[0.15em] text-[var(--text-tertiary)] font-black border-r border-[var(--border)]`}>Dự toán ngân sách</th>
                <th className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-2 uppercase text-[10px] tracking-[0.15em] text-[var(--text-tertiary)] font-black border-r border-[var(--border)]`}>Chi phí thực tế</th>
                <th className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-2 uppercase text-[10px] tracking-[0.15em] text-[var(--text-tertiary)] font-black border-r border-[var(--border)]`}>Chênh lệch</th>
                <th className={`${COL_WIDTHS.PROGRESS} text-center px-4 py-2 uppercase text-[10px] tracking-[0.15em] text-[var(--text-tertiary)] font-black border-none`}>Tiến độ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {data.length > 0 ? (
                renderRows(data)
              ) : (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-[10.5px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em]">
                    Không có dữ liệu WBS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {hasMore && (
        <div className="flex justify-center border-t border-[var(--border)] bg-[var(--secondary)]/10">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 py-3 w-full justify-center text-[9px] font-black uppercase tracking-[0.25em] text-[var(--text-tertiary)] hover:text-blue-500 hover:bg-blue-500/5 transition-executive group"
          >
            {isExpanded ? (
              <>
                <svg viewBox="0 0 24 24" className="h-3 w-3 group-hover:-translate-y-0.5 transition-executive" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m18 15-6-6-6 6" /></svg>
                Thu gọn danh sách
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 group-hover:translate-y-0.5 transition-executive" fill="none" stroke="currentColor" strokeWidth="3.5"><path d="m6 9 6 6 6-6" /></svg>
                + {totalRows - INITIAL_VISIBLE_COUNT} XEM THÊM
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}