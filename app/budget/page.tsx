'use client';

import { useState, useMemo } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { COL_WIDTHS, FINANCIAL_CELL_CLASS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';
import { formatVnd } from '@/app/components/dashboard-data';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';

import { useBudgetsQuery } from '@/services/queries/useBudgets';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import { exportToCsv } from '@/app/services/export.service';

export default function BudgetPage() {
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const { data: budgets = [] } = useBudgetsQuery(currentProjectId);
  const { data: costsData = [] } = useCostsQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  
  // Construction Semantic: Actual Cost = APPROVED (Realized), not just paid.
  const costs = Array.isArray(costsData) ? costsData.filter((c: any) => c.approvalStatus === "APPROVED") : [];
  const wbsItems = wbsData?.flat || [];

  // 1. Create lookup maps for performance
  const wbsNameMap = useMemo(() => {
    const map = new Map<string, string>();
    wbsItems.forEach(w => map.set(w.id, w.name));
    return map;
  }, [wbsItems]);

  const costByWbsMap = useMemo(() => {
    const map = new Map<string, number>();
    costs.forEach(c => {
      map.set(c.wbsId, (map.get(c.wbsId) ?? 0) + (parseFloat(c.amount as any) || 0));
    });
    return map;
  }, [costs]);

  // 2. Aggregate Global KPIs
  const { totalBudget, totalUsed, remaining, pct } = useMemo(() => {
    const b = budgets.reduce((sum: number, b: any) => sum + (Number(b.estimatedAmount) || 0), 0);
    const u = costs.reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
    const r = b - u;
    const p = b > 0 ? (u / b) * 100 : (u > 0 ? 100 : 0);
    return { totalBudget: b, totalUsed: u, remaining: r, pct: p };
  }, [budgets, costs]);

  // 3. Unified Financial View (Construction Accounting Standard)
  const unifiedData = useMemo(() => {
    // Map WBS items and inject their financials
    return wbsItems.map(wbs => {
      // Aggregate all budget records for this WBS
      const wbsBudget = budgets
        .filter((b: any) => b.wbsId === wbs.id)
        .reduce((sum: number, b: any) => sum + (Number(b.estimatedAmount) || 0), 0);
      
      // Aggregate all costs for this WBS
      const wbsActual = costByWbsMap.get(wbs.id) ?? 0;
      const variance = wbsBudget - wbsActual;
      const progress = wbsBudget > 0 ? (wbsActual / wbsBudget) * 100 : (wbsActual > 0 ? 100 : 0);
      
      let status = "NORMAL";
      if (wbsBudget === 0 && wbsActual > 0) status = "UNBUDGETED";
      else if (wbsActual > wbsBudget) status = "OVERRUN";
      else if (wbsActual > 0) status = "EXECUTING";

      return {
        id: wbs.id,
        name: wbs.name,
        budget: wbsBudget,
        actual: wbsActual,
        variance,
        progress,
        status
      };
    }).filter(item => item.budget >= 0); // Show all WBS items so PMs can see what needs budgeting
  }, [wbsItems, budgets, costByWbsMap]);

  return (
    <div className="erp-page">
      <AddBudgetModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
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
              { label: 'Giá trị thực hiện', value: formatVnd(totalUsed), unit: 'VNĐ', accent: 'text-amber-500' },
              { label: 'Ngân sách còn lại', value: formatVnd(remaining), unit: 'VNĐ', accent: remaining >= 0 ? 'text-emerald-500' : 'text-rose-500' },
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
              <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">Tiến độ sử dụng ngân sách</h3>
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
              <span className="tabular-nums tracking-tighter">{formatVnd(totalBudget)} VNĐ</span>
            </div>
          </section>

          {/* Budget Items Table */}
          <section className="card-elevation overflow-hidden border border-[var(--border)] rounded-lg">
            <div className="flex items-center justify-between p-5 border-b border-[var(--border)] bg-[var(--secondary)]/30">
              <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-widest">Chi tiết dự toán theo hạng mục</h3>
              <div className="flex items-center gap-3">
                <button 
                  onClick={() => {
                    if (unifiedData.length === 0) return;
                    const dataToExport = unifiedData.map((item: any) => {
                      return {
                        'Mã WBS': item.id.slice(0, 8),
                        'Hạng mục thi công': item.name,
                        'Dự toán ngân sách (VNĐ)': item.budget,
                        'Giá trị thực hiện (VNĐ)': item.actual,
                        'Chênh lệch (VNĐ)': item.variance,
                        'Trạng thái': item.status
                      };
                    });
                    exportToCsv(`ERP_Budget_Audit_${currentProjectId.slice(0,8)}.csv`, dataToExport);
                  }}
                  className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--hover-bg)] gap-1.5 h-9"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4-4-4m4 4V4" /></svg>
                  Xuất Excel
                </button>
                <button 
                  onClick={() => setIsAddModalOpen(true)}
                  className="erp-btn bg-blue-600 text-white hover:bg-blue-500 shadow-sm gap-1.5 h-9"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M12 5v14M5 12h14" />
                  </svg>
                  Thêm dự toán
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="erp-table w-full table-fixed min-w-max">
                <thead>
                  <tr>
                    <th className={`${COL_WIDTHS.INDEX} text-center bg-[var(--table-head-bg)] uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)]`}>Mã WBS</th>
                    <th className={`${COL_WIDTHS.NAME_WBS} text-left px-4 bg-[var(--table-head-bg)] uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)]`}>Hạng mục thi công</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)]`}>{ERP_TERMINOLOGY.FINANCE.BUDGET}</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)]`}>{ERP_TERMINOLOGY.FINANCE.ACTUAL}</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)]`}>Chênh lệch</th>
                    <th className={`${COL_WIDTHS.STATUS} text-center bg-[var(--table-head-bg)] uppercase text-[10px] tracking-widest text-[var(--text-muted)] border-r border-[var(--border)]`}>Trạng thái</th>
                    <th className={`${COL_WIDTHS.ACTIONS} text-center bg-[var(--table-head-bg)] uppercase text-[10px] tracking-widest text-[var(--text-muted)]`}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {unifiedData.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="h-32 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Chưa có dữ liệu phân bổ ngân sách
                      </td>
                    </tr>
                  ) : (
                    unifiedData.map((item: any, i: number) => {
                      return (
                        <tr key={item.id}>
                          <td className={`${COL_WIDTHS.INDEX} text-center font-bold text-[var(--text-muted)] tabular-nums border-r border-[var(--border)]`}>{i + 1}</td>
                          <td className={`${COL_WIDTHS.NAME_WBS} font-semibold text-[var(--text-primary)] px-4 border-r border-[var(--border)]`}>{item.name}</td>
                          <td className={`${COL_WIDTHS.FINANCIAL} text-right font-bold tabular-nums text-[var(--text-primary)] border-r border-[var(--border)]`}>{formatVnd(item.budget)}</td>
                          <td className={`${COL_WIDTHS.FINANCIAL} text-right font-bold tabular-nums text-amber-500 border-r border-[var(--border)]`}>{formatVnd(item.actual)}</td>
                          <td className={`${COL_WIDTHS.FINANCIAL} text-right font-bold tabular-nums border-r border-[var(--border)] ${item.variance >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{formatVnd(item.variance)}</td>
                          <td className={`${COL_WIDTHS.STATUS} px-4 border-r border-[var(--border)] text-center`}>
                            {item.status === "UNBUDGETED" ? (
                              <span className="erp-badge border-rose-500/30 text-rose-600 bg-rose-500/10 font-bold">CHƯA LẬP DỰ TOÁN</span>
                            ) : item.status === "OVERRUN" ? (
                              <span className="erp-badge border-rose-600 text-white bg-rose-600 font-bold animate-pulse">VƯỢT ĐỊNH MỨC</span>
                            ) : item.status === "EXECUTING" ? (
                              <span className="erp-badge border-blue-500/30 text-blue-600 bg-blue-500/10 font-bold">ĐANG THI CÔNG</span>
                            ) : (
                              <span className="erp-badge border-[var(--border)] text-[var(--text-muted)] bg-[var(--secondary)]">KẾ HOẠCH</span>
                            )}
                          </td>
                          <td className={`${COL_WIDTHS.ACTIONS} text-center`}>
                            <button className="text-[10px] font-bold text-blue-500 hover:text-blue-400 transition-colors uppercase tracking-widest">Chi tiết</button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                {/* FOOTER TOTALS - Guaranteed Alignment */}
                <tfoot className="border-t-2 border-[var(--border)] bg-[var(--secondary)]/30 font-black">
                  <tr>
                    <td className={`${COL_WIDTHS.INDEX} text-center border-r border-[var(--border)]`}></td>
                    <td className={`${COL_WIDTHS.NAME_WBS} px-4 py-3 text-[11px] uppercase tracking-wider text-[var(--text-primary)] border-r border-[var(--border)]`}>
                      TỔNG CỘNG DỰ TOÁN DỰ ÁN
                    </td>
                    <td className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-3 tabular-nums border-r border-[var(--border)] text-blue-600`}>
                      {formatVnd(totalBudget)}
                    </td>
                    <td className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-3 tabular-nums border-r border-[var(--border)] text-amber-500`}>
                      {formatVnd(totalUsed)}
                    </td>
                    <td className={`${COL_WIDTHS.FINANCIAL} text-right px-4 py-3 tabular-nums border-r border-[var(--border)] ${remaining >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {formatVnd(remaining)}
                    </td>
                    <td className={`${COL_WIDTHS.PROGRESS} text-center px-4 py-3 border-r border-[var(--border)] text-blue-500`}>
                      {pct.toFixed(1)}%
                    </td>
                    <td className={`${COL_WIDTHS.ACTIONS}`}></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
