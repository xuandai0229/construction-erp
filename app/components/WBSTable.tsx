'use client';

import React from 'react';
import { WBSBudgetRow, formatVnd } from './dashboard-data';
import { COL_WIDTHS, FINANCIAL_CELL_CLASS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';

export default function WBSTable({ data }: { data: WBSBudgetRow[] }) {
  const renderRows = (items: WBSBudgetRow[], level = 0): React.ReactNode => {
    return items.map((item) => {
      const percentage = item.budget > 0 ? (item.actual / item.budget) * 100 : 0;
      const isOverBudget = percentage > 100;

      return (
        <React.Fragment key={item.id}>
          <tr className="group erp-table-row">
            {/* WBS Name */}
            <td className={`${COL_WIDTHS.NAME_WBS} whitespace-nowrap py-1.5 px-4`}>
              <div className="flex items-center gap-2" style={{ paddingLeft: `${level * 14}px` }}>
                {item.children.length > 0 && (
                  <svg viewBox="0 0 24 24" className="h-3 w-3 shrink-0 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                )}
                <span className={`font-bold ${level === 0 ? 'text-blue-600 text-[11px]' : 'text-[var(--text-secondary)] text-[10.5px]'}`}>
                  {item.name}
                </span>
              </div>
            </td>

            <td className={`${COL_WIDTHS.FINANCIAL} text-right py-1.5 ${FINANCIAL_CELL_CLASS} text-[11px] text-[var(--text-tertiary)] whitespace-nowrap`}>
              {formatVnd(item.budget)}
            </td>
            <td className={`${COL_WIDTHS.FINANCIAL} text-right py-1.5 ${FINANCIAL_CELL_CLASS} text-[11px] text-[var(--text-primary)] group-hover:text-blue-500 transition-colors whitespace-nowrap`}>
              {formatVnd(item.actual)}
            </td>
            <td className={`${COL_WIDTHS.FINANCIAL} text-right py-1.5 ${FINANCIAL_CELL_CLASS} text-[11px] whitespace-nowrap ${item.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {item.profit >= 0 ? '+' : ''}{formatVnd(item.profit)}
            </td>

            {/* Progress bar */}
            <td className={`${COL_WIDTHS.PROGRESS} text-center py-1.5`}>
              <div className="flex flex-col items-center gap-0.5 px-2">
                <div className="h-1 w-full overflow-hidden rounded-full bg-[var(--secondary)]">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      isOverBudget
                        ? 'bg-rose-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${Math.min(100, percentage)}%` }}
                  />
                </div>
                <span className={`text-[8px] font-black tracking-tight ${isOverBudget ? 'text-rose-500' : 'text-[var(--text-muted)]'}`}>
                  {percentage.toFixed(1)}%
                </span>
              </div>
            </td>
          </tr>
          {item.children.length > 0 && renderRows(item.children, level + 1)}
        </React.Fragment>
      );
    });
  };

  return (
    <div className="overflow-x-auto scrollbar-hide border border-[var(--border)] rounded-lg">
      <table className="erp-table w-full table-fixed min-w-max">
        <thead>
          <tr>
            <th className={`${COL_WIDTHS.NAME_WBS} bg-[var(--table-head-bg)] text-left px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Hạng mục thi công (WBS)</th>
            <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>{ERP_TERMINOLOGY.FINANCE.BUDGET}</th>
            <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>{ERP_TERMINOLOGY.FINANCE.ACTUAL}</th>
            <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>{ERP_TERMINOLOGY.FINANCE.VARIANCE}</th>
            <th className={`${COL_WIDTHS.PROGRESS} text-center bg-[var(--table-head-bg)] py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Tiến độ %</th>
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? renderRows(data) : (
            <tr>
              <td colSpan={5} className="h-32 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                Không có dữ liệu WBS
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
