'use client';

import { useMemo } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';

function formatVnd(n: number) {
  return n.toLocaleString('vi-VN');
}

import { useBudgetsQuery } from '@/services/queries/useBudgets';
import { useCostsQuery } from '@/services/queries/useCosts';

export default function BudgetPage() {
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  
  const { data: budgets = [] } = useBudgetsQuery(currentProjectId);
  const { data: costsData = [] } = useCostsQuery(currentProjectId);
  const costs = Array.isArray(costsData) ? costsData : [];

  const totalBudget = budgets.reduce((sum: number, b: any) => sum + (b.estimatedAmount || 0), 0);
  const totalUsed   = costs.reduce((sum: number, c: any) => sum + (c.amount || 0), 0);
  const remaining   = totalBudget - totalUsed;
  const pct         = totalBudget > 0 ? (totalUsed / totalBudget) * 100 : 0;

  return (
    <div className="erp-page">
      <Sidebar activeItem="budget" />
      <main
        className={`erp-page-main transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}
      >
        <Header data={{ costs, budgets } as any} />

        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
          <div className="accent-line">
            <h1 className="erp-section-title">Dự toán ngân sách</h1>
            <p className="erp-section-subtitle">Quản lý dự toán & giám sát ngân sách theo hạng mục</p>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Tổng ngân sách', value: formatVnd(totalBudget), unit: 'VNĐ', accent: 'text-blue-500' },
              { label: 'Đã sử dụng', value: formatVnd(totalUsed), unit: 'VNĐ', accent: 'text-amber-500' },
              { label: 'Còn lại', value: formatVnd(remaining), unit: 'VNĐ', accent: remaining >= 0 ? 'text-emerald-500' : 'text-rose-500' },
              { label: 'Tỷ lệ sử dụng', value: `${pct.toFixed(1)}%`, unit: '', accent: pct > 90 ? 'text-rose-500' : pct > 70 ? 'text-amber-500' : 'text-emerald-500' },
            ].map(kpi => (
              <div key={kpi.label} className="card-elevation p-5">
                <div className="text-[9.5px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-2">{kpi.label}</div>
                <div className={`text-2xl font-black tabular-nums ${kpi.accent}`}>{kpi.value}</div>
                {kpi.unit && <div className="text-[9px] font-bold text-[var(--text-muted)] mt-0.5">{kpi.unit}</div>}
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <section className="card-elevation p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">Tiến độ giải ngân</h3>
              <span className={`text-[13px] font-black tabular-nums ${pct > 90 ? 'text-rose-500' : pct > 70 ? 'text-amber-500' : 'text-emerald-500'}`}>
                {pct.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-[var(--secondary)] border border-[var(--border)] overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${pct > 90 ? 'bg-rose-500' : pct > 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-[10px] font-bold text-[var(--text-muted)]">
              <span>0 VNĐ</span>
              <span>{formatVnd(totalBudget)} VNĐ</span>
            </div>
          </section>

          {/* Budget Items Table */}
          <section className="card-elevation overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)]">
              <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">Chi tiết dự toán theo hạng mục</h3>
              <button className="erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-sm gap-1.5">
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Thêm dự toán
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Hạng mục</th>
                    <th className="text-right">Ngân sách (VNĐ)</th>
                    <th className="text-right">Thực tế (VNĐ)</th>
                    <th className="text-right">Còn lại</th>
                    <th className="w-[120px]">Tiến độ</th>
                    <th className="text-center">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {budgets.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Chưa có dữ liệu dự toán
                      </td>
                    </tr>
                  ) : (
                    budgets.map((b: any, i: number) => {
                      const used = 0; // placeholder — real value from cost rollup by wbsId
                      const rem  = b.estimatedAmount - used;
                      const p    = b.estimatedAmount > 0 ? (used / b.estimatedAmount) * 100 : 0;
                      return (
                        <tr key={b.id}>
                          <td className="text-center font-bold text-[var(--text-muted)] tabular-nums">{i + 1}</td>
                          <td className="font-semibold text-[var(--text-primary)]">{b.wbsId || 'Chung'}</td>
                          <td className="text-right font-bold tabular-nums text-[var(--text-primary)]">{formatVnd(b.estimatedAmount)}</td>
                          <td className="text-right font-bold tabular-nums text-amber-500">{formatVnd(used)}</td>
                          <td className={`text-right font-bold tabular-nums ${rem >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatVnd(rem)}</td>
                          <td>
                            <div className="flex items-center gap-2">
                              <div className="h-1.5 flex-1 rounded-full bg-[var(--secondary)] border border-[var(--border)] overflow-hidden">
                                <div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, p)}%` }} />
                              </div>
                              <span className="text-[10px] font-black text-[var(--text-muted)] tabular-nums w-8 text-right">{p.toFixed(0)}%</span>
                            </div>
                          </td>
                          <td className="text-center">
                            <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors">Sửa</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
