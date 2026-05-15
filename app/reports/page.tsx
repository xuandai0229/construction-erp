'use client';

import { useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { COL_WIDTHS, ERP_TERMINOLOGY, FINANCIAL_CELL_CLASS } from '@/app/utils/table-constants';

// Mock report generation since these are complex queries
const generateMockMonthlyReport = (projectId: string) => {
  return [
    { month: '2024-01', cashIn: 1000000, cashOut: 500000, revenue: 1200000, cost: 600000, profit: 600000, runningBalance: 500000 },
    { month: '2024-02', cashIn: 2000000, cashOut: 1500000, revenue: 2500000, cost: 1800000, profit: 700000, runningBalance: 1000000 },
  ];
};

const generateMockAgingReport = (projectId: string) => {
  return [
    { id: '1', type: 'receivable', entityName: 'Khách hàng A', amount: 500000, date: '2024-01-01', daysOverdue: 15, category: '0-30' },
    { id: '2', type: 'payable', entityName: 'Nhà cung cấp B', amount: 300000, date: '2024-01-01', daysOverdue: 45, category: '31-60' },
  ];
};

export default function ReportsPage() {
  const currentProjectId  = useERPStore(state => state.currentProjectId);
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const sidebarCollapsed  = useERPStore(state => state.sidebarCollapsed);

  const monthlyData = useMemo(() => generateMockMonthlyReport(currentProjectId), [currentProjectId]);
  const agingData   = useMemo(() => generateMockAgingReport(currentProjectId),  [currentProjectId]);
  const locks: string[] = [];
  const toggleLock = (month: string) => {};
  const agingCats   = ['0-30', '31-60', '61-90', '90+'];

  const handleExport = () => {
    const project  = projects.find(p => p.id === currentProjectId);
    const filename = `BC_Thang_${project?.name || 'Project'}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCsv(filename, monthlyData);
  };

  return (
    <div className="erp-page">
      <Sidebar activeItem="reports" />
      <main
        className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}
      >
        <Header />
        <div className="erp-content-container animate-fade-in space-y-8">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="accent-line">
              <h1 className="erp-section-title">Báo cáo tài chính</h1>
              <p className="erp-section-subtitle">Phân tích dòng tiền, công nợ và chốt kỳ kế toán</p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <select
                value={currentProjectId}
                onChange={e => setCurrentProject(e.target.value)}
                className="erp-input h-9 w-auto px-3 text-[13px]"
              >
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <button
                onClick={handleExport}
                className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                </svg>
                Xuất Excel
              </button>
            </div>
          </div>

          {/* Monthly Report */}
          <section className="card-elevation overflow-hidden">
            <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
              <h2 className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                Kết quả kinh doanh theo tháng
              </h2>
              <div className="flex items-center gap-2 text-[11px] text-[var(--text-muted)] italic">
                <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                Kỳ kế toán đã khóa (không thể sửa)
              </div>
            </div>
            <div className="overflow-x-auto scrollbar-hide">
              <table className="erp-table">
                <thead>
                  <tr>
                    <th className={`${COL_WIDTHS.DATE} bg-[var(--table-head-bg)] text-center px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Tháng</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Tổng thu</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Tổng chi</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>{ERP_TERMINOLOGY.FINANCE.REVENUE}</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Chi phí</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Lợi nhuận</th>
                    <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Số dư</th>
                    <th className={`${COL_WIDTHS.STATUS} text-center bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black`}>Khóa sổ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map(row => {
                    const locked = locks.includes(row.month);
                    return (
                      <tr key={row.month} className={`group ${locked ? 'bg-rose-500/5' : ''}`}>
                        <td className={`${COL_WIDTHS.DATE} text-center font-bold text-[var(--text-primary)] border-r border-[var(--border)] tabular-nums`}>
                          <div className="flex items-center justify-center gap-2">
                            {locked && (
                              <svg viewBox="0 0 24 24" className="h-3 w-3 text-rose-500 shrink-0" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                              </svg>
                            )}
                            {row.month}
                          </div>
                        </td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-semibold text-emerald-500 whitespace-nowrap px-4 py-3 border-r border-[var(--border)]`}>{formatVnd(row.cashIn)}</td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-semibold text-rose-500 whitespace-nowrap px-4 py-3 border-r border-[var(--border)]`}>{formatVnd(row.cashOut)}</td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums text-[var(--text-secondary)] whitespace-nowrap px-4 py-3 border-r border-[var(--border)]`}>{formatVnd(row.revenue)}</td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums text-[var(--text-secondary)] whitespace-nowrap px-4 py-3 border-r border-[var(--border)]`}>{formatVnd(row.cost)}</td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-bold whitespace-nowrap px-4 py-3 border-r border-[var(--border)] ${row.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {row.profit >= 0 ? '+' : ''}{formatVnd(row.profit)}
                        </td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-extrabold whitespace-nowrap px-4 py-3 border-r border-[var(--border)] ${row.runningBalance >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                          {formatVnd(row.runningBalance)}
                        </td>
                        <td className={`${COL_WIDTHS.STATUS} text-center px-4 py-3 border-r border-[var(--border)]`}>
                          <button
                            onClick={() => toggleLock(row.month)}
                            className={`erp-btn h-7 px-3 text-[10px] ${locked
                              ? 'bg-rose-500/15 text-rose-500 border border-rose-500/25 hover:bg-rose-500/25'
                              : 'bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
                            }`}
                          >
                            {locked ? 'Mở khóa' : 'Khóa sổ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {monthlyData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="h-32 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                        Chưa có dữ liệu phát sinh
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Aging Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Receivable Aging */}
            <section className="card-elevation overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)]" />
                <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                  Phân tích tuổi nợ phải thu
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {agingCats.map(cat => {
                  const items = agingData.filter((i: any) => i.type === 'receivable' && i.category === cat);
                  const total = items.reduce((s: number, i: any) => s + i.amount, 0);
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                      <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">{cat} ngày</div>
                        <div className="text-[14px] font-black text-[var(--text-primary)] tabular-nums mt-0.5">{formatVnd(total)}</div>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">{items.length} khoản</div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* Payable Aging */}
            <section className="card-elevation overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                <h3 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                  Phân tích tuổi nợ phải trả
                </h3>
              </div>
              <div className="p-5 space-y-3">
                {agingCats.map(cat => {
                  const items = agingData.filter((i: any) => i.type === 'payable' && i.category === cat);
                  const total = items.reduce((s: number, i: any) => s + i.amount, 0);
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)]">
                      <div>
                        <div className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider">{cat} ngày</div>
                        <div className="text-[14px] font-black text-[var(--text-primary)] tabular-nums mt-0.5">{formatVnd(total)}</div>
                      </div>
                      <div className="text-[11px] text-[var(--text-muted)]">{items.length} khoản</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
