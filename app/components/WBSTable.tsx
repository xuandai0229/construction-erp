'use client';

import React from 'react';
import { DashboardData, formatVnd } from './dashboard-data';
import { useERPStore } from '@/store/erpStore';

export default function WBSTable({ data }: { data: DashboardData }) {
  const getWBSTreeWithCost = useERPStore(s => s.getWBSTreeWithCost);
  const { tree } = getWBSTreeWithCost();

  const totalBudget = tree.reduce((sum, node) => sum + node.budget, 0);
  const totalActual = tree.reduce((sum, node) => sum + node.actual, 0);
  const totalVariance = totalActual - totalBudget;
  const totalPct = totalBudget > 0 ? (totalActual / totalBudget) * 100 : 0;

  return (
    <div className="erp-card flex flex-col h-full">
      <div className="erp-panel-header">
        <h3 className="t-section-title">WBS — Hạng mục và Dự toán</h3>
        <span className="text-[11px] font-bold text-[var(--text-secondary)]">VND</span>
      </div>
      
      <div className="erp-table-wrap flex-1 border-none rounded-none overflow-y-auto">
        <table className="erp-table">
          <thead>
            <tr>
              <th className="min-w-[200px]">Hạng mục</th>
              <th className="text-right">Dự toán</th>
              <th className="text-right">Thực tế</th>
              <th className="text-right">Chênh lệch</th>
              <th className="text-right w-16">%</th>
            </tr>
          </thead>
          <tbody>
            {renderRows(tree)}
          </tbody>
          <tfoot className="sticky bottom-0 z-20">
            <tr className="bg-[var(--bg-subtle)] font-bold border-t-2 border-[var(--brand)]">
              <td className="uppercase text-[var(--brand)]">Tổng cộng</td>
              <td className="text-right text-[var(--brand)] text-money">{formatVnd(totalBudget)}</td>
              <td className="text-right text-[var(--brand)] text-money">{formatVnd(totalActual)}</td>
              <td className={`text-right text-money ${totalVariance > 0 ? 'text-[var(--danger)]' : 'text-[var(--success)]'}`}>
                {formatVnd(totalVariance)}
              </td>
              <td className="text-right text-[var(--brand)]">{totalPct.toFixed(1)}%</td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function renderRows(nodes: any[], level = 0): React.ReactNode {
  return nodes.map((node) => {
    const isParent = node.children && node.children.length > 0;
    const pct = node.budget > 0 ? (node.actual / node.budget) * 100 : 0;
    const variance = node.actual - node.budget;

    return (
      <React.Fragment key={node.id}>
        <tr className={isParent ? 'wbs-row-parent' : 'wbs-row-child'}>
          <td className="relative" style={{ paddingLeft: `${level * 24 + 16}px` }}>
            {level > 0 && (
              <div 
                className="absolute left-4 top-0 bottom-0 w-px bg-[var(--border)]" 
                style={{ left: `${(level - 1) * 24 + 28}px` }}
              />
            )}
            <div className="flex items-center gap-2">
              {isParent ? (
                <svg viewBox="0 0 24 24" className="h-3 w-3 text-[var(--text-secondary)]" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="m19 9-7 7-7-7" />
                </svg>
              ) : (
                <div className="w-3" />
              )}
              <span className="truncate">{node.name}</span>
            </div>
          </td>
          <td className="text-right text-money">{formatVnd(node.budget)}</td>
          <td className="text-right text-money">{formatVnd(node.actual)}</td>
          <td className={`text-right text-money ${variance > 0 ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}`}>
            {formatVnd(variance)}
          </td>
          <td className="text-right font-medium">
            <span className={pct > 100 ? 'text-[var(--danger)]' : 'text-[var(--text-secondary)]'}>
              {pct.toFixed(0)}%
            </span>
          </td>
        </tr>
        {isParent && renderRows(node.children, level + 1)}
      </React.Fragment>
    );
  });
}
