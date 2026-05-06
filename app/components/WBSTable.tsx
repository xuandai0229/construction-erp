'use client';

import { useMemo, useState } from 'react';
import { DashboardData, WBSBudgetRow, formatVnd } from './dashboard-data';

export default function WBSTable({ data }: { data: DashboardData }) {
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set(data.wbsRows.map((row) => row.id)));
  const rows = useMemo(() => flattenRows(data.wbsRows, expanded), [data.wbsRows, expanded]);
  const totalBudget = data.budget.reduce((sum, row) => sum + row.estimatedAmount, 0);
  const totalActual = data.costs.reduce((sum, row) => sum + row.amount, 0);
  const totalVariance = totalBudget - totalActual;

  function toggle(id: string) {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70">
      <div className="border-b border-slate-800 px-5 py-4">
        <h3 className="text-[15px] font-extrabold text-slate-50">WBS - HẠNG MỤC VÀ DỰ TOÁN</h3>
      </div>
      <div className="overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-slate-900 text-xs font-bold text-slate-300">
            <tr className="border-b border-slate-800">
              <th className="w-[30%] px-4 py-3 text-left">Hạng mục</th>
              <th className="w-[15%] px-4 py-3 text-right">Dự toán</th>
              <th className="w-[15%] px-4 py-3 text-right">Thực tế</th>
              <th className="w-[15%] px-4 py-3 text-right">Chênh lệch</th>
              <th className="w-[15%] px-4 py-3 text-right">Lợi nhuận</th>
              <th className="w-[10%] px-4 py-3 text-right">%</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const variance = row.budget - row.actual;
              const percentage = row.budget > 0 ? (row.actual / row.budget) * 100 : 0;
              const hasChildren = row.children.length > 0;
              return (
                <tr key={row.id} className="border-b border-slate-800/80 hover:bg-slate-800/40">
                  <td className="px-4 py-2.5 font-semibold text-slate-100">
                    <div className="flex items-center" style={{ paddingLeft: row.level * 20 }}>
                      {hasChildren ? (
                        <button onClick={() => toggle(row.id)} className="mr-2 grid h-5 w-5 place-items-center text-slate-300 hover:text-white">
                          <svg viewBox="0 0 24 24" className={`h-4 w-4 ${expanded.has(row.id) ? 'rotate-90' : ''}`} fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="m9 18 6-6-6-6" />
                          </svg>
                        </button>
                      ) : (
                        <span className="mr-2 h-5 w-5" />
                      )}
                      <span className={row.level === 0 ? 'font-extrabold' : 'font-medium'}>{row.name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-100">{formatVnd(row.budget)}</td>
                  <td className="px-4 py-2.5 text-right font-medium text-slate-100">{formatVnd(row.actual)}</td>
                  <td className={`px-4 py-2.5 text-right font-extrabold ${variance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatVnd(variance)}</td>
                  <td className={`px-4 py-2.5 text-right font-extrabold ${row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatVnd(row.profit)}</td>
                  <td className="px-4 py-2.5 text-right font-extrabold text-slate-100">{percentage.toFixed(1)}%</td>
                </tr>
              );
            })}
            <tr className="bg-blue-950/30 text-sm font-extrabold text-white">
              <td className="px-4 py-3 pl-10">TỔNG CỘNG</td>
              <td className="px-4 py-3 text-right">{formatVnd(totalBudget)}</td>
              <td className="px-4 py-3 text-right">{formatVnd(totalActual)}</td>
              <td className={`px-4 py-3 text-right ${totalVariance >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatVnd(totalVariance)}</td>
              <td className={`px-4 py-3 text-right font-bold ${data.revenue - totalActual >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>{formatVnd(data.revenue - totalActual)}</td>
              <td className="px-4 py-3 text-right">{totalBudget > 0 ? ((totalActual / totalBudget) * 100).toFixed(1) : '0'}%</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function flattenRows(rows: WBSBudgetRow[], expanded: Set<string>): WBSBudgetRow[] {
  return rows.flatMap((row) => [row, ...(expanded.has(row.id) ? flattenRows(row.children, expanded) : [])]);
}

