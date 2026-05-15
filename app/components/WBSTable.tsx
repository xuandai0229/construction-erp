'use client';

import React, { useState } from 'react';
import { WBSBudgetRow, formatVnd } from './dashboard-data';
import { COL_WIDTHS, FINANCIAL_CELL_CLASS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';
import { useTableUX } from '@/app/hooks/useTableUX';

export default function WBSTable({ data }: { data: WBSBudgetRow[] }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const INITIAL_VISIBLE_COUNT = 5;
  const { scrollContainerRef, showScrollHint, dragCursorClass } = useTableUX();

  const renderRows = (items: WBSBudgetRow[], level = 0, state = { count: 0 }): React.ReactNode => {
    return items.map((item) => {
      // If not expanded, we limit the TOTAL count of rows shown
      if (!isExpanded && state.count >= INITIAL_VISIBLE_COUNT) return null;
      state.count++;

      const percentage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
      const isOverBudget = percentage > 100;

      return (
        <React.Fragment key={item.id}>
          <tr className="group erp-table-row select-none">
            {/* WBS Name */}
            <td className="w-[280px] whitespace-nowrap py-1.5 px-4 border-r border-[var(--border)]">
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 14}px` }}>
                {item.children.length > 0 && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                <span className={`font-bold truncate ${level === 0 ? 'text-blue-600 text-[11px]' : 'text-[var(--text-secondary)] text-[10.5px]'}`} title={item.name}>
                  {item.name}
                </span>
              </div>
            </td>

            <td className={`w-[150px] text-right py-1.5 px-3 ${FINANCIAL_CELL_CLASS} text-[11px] text-[var(--text-tertiary)] font-bold tabular-nums whitespace-nowrap border-r border-[var(--border)]`}>
              {formatVnd(item.budget)}
            </td>
            <td className={`w-[150px] text-right py-1.5 px-3 ${FINANCIAL_CELL_CLASS} text-[11px] text-[var(--text-primary)] font-bold tabular-nums group-hover:text-blue-500 transition-colors whitespace-nowrap border-r border-[var(--border)]`}>
              {formatVnd(item.actual)}
            </td>
            <td className={`w-[150px] text-right py-1.5 px-3 ${FINANCIAL_CELL_CLASS} text-[11px] font-bold tabular-nums whitespace-nowrap border-r border-[var(--border)] ${item.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {item.profit >= 0 ? '+' : ''}{formatVnd(item.profit)}
            </td>

            {/* Progress bar */}
            <td className={`${COL_WIDTHS.PROGRESS} text-center py-1.5`}>
              <div className="flex flex-col items-center gap-0.5 px-2">
                <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${isOverBudget
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                      }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <span className={`text-[8px] font-bold tracking-tight ${isOverBudget ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
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

  // Calculate total rows for "See More" visibility
  const countAllRows = (items: WBSBudgetRow[]): number => {
    return items.reduce((acc, item) => acc + 1 + countAllRows(item.children), 0);
  };
  const totalRows = countAllRows(data);
  const hasMore = totalRows > INITIAL_VISIBLE_COUNT;

  return (
    <div className="flex flex-col">
      <div className={`scroll-hint-container ${showScrollHint ? 'scroll-hint-right' : ''}`}>
        <div
          ref={scrollContainerRef}
          className={`overflow-x-auto scrollbar-hide border border-[var(--border)] rounded-lg ${dragCursorClass}`}
        >
          {showScrollHint && (
            <div className="scroll-hint-icon" title="Cuộn ngang để xem thêm">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="3"><path d="m9 18 6-6-6-6" /></svg>
            </div>
          )}
          <table className="erp-table w-full table-fixed min-w-max">
            <thead>
              <tr>
                <th className="w-[280px] bg-[var(--table-head-bg)] text-left px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-bold border-r border-[var(--border)]">Hạng mục thi công (WBS)</th>
                <th className="w-[150px] text-right bg-[var(--table-head-bg)] px-3 py-2 uppercase text-[10px] tracking-normal text-[var(--text-muted)] font-bold border-r border-[var(--border)]">Dự toán ngân sách</th>
                <th className="w-[150px] text-right bg-[var(--table-head-bg)] px-3 py-2 uppercase text-[10px] tracking-normal text-[var(--text-muted)] font-bold border-r border-[var(--border)]">Giá trị thực hiện</th>
                <th className="w-[150px] text-right bg-[var(--table-head-bg)] px-3 py-2 uppercase text-[10px] tracking-normal text-[var(--text-muted)] font-bold border-r border-[var(--border)]">Chênh lệch</th>
                <th className={`${COL_WIDTHS.PROGRESS} text-center bg-[var(--table-head-bg)] py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-bold border-none`}>Tiến độ %</th>
              </tr>
            </thead>
            <tbody>
              {data.length > 0 ? (
                renderRows(data)
              ) : (
                <tr>
                  <td colSpan={5} className="h-32 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                    Không có dữ liệu WBS
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          
          {/* Bottom Fade Overlay - only when NOT expanded and has more data */}
          {!isExpanded && hasMore && (
            <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-t from-[var(--card)] to-transparent pointer-events-none z-10" 
              style={{ opacity: 0.8 }}
            />
          )}
        </div>
      </div>

      {hasMore && (
        <div className="mt-3 flex justify-center">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md text-[9px] font-bold uppercase tracking-widest text-[var(--text-muted)] hover:text-blue-500 hover:bg-blue-500/5 hover:border-blue-500/20 transition-all duration-200 border border-transparent hover:border-blue-500/30"
          >
            {isExpanded ? (
              <>
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="m18 15-6-6-6 6" /></svg>
                Ẩn bớt
              </>
            ) : (
              <>
                <svg viewBox="0 0 24 24" className="h-2.5 w-2.5" fill="none" stroke="currentColor" strokeWidth="3"><path d="m6 9 12 0-6 6-6-6" /></svg>
                +{totalRows - INITIAL_VISIBLE_COUNT} Xem thêm
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}