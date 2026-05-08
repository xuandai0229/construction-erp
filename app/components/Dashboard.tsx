'use client';

import { useState, useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';
import Sidebar from './Sidebar';
import Header from './Header';
import KPISection from './KPISection';
import ChartSection from './ChartSection';
import WBSTable from './WBSTable';
import CostTable from './CostTable';
import DebtPanel from './DebtPanel';
import ProfitPanel from './ProfitPanel';
import AddCostModal from './modals/AddCostModal';
import { CostRecord } from '../types';
import { formatDate, formatVnd } from './dashboard-data';

export default function Dashboard() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);

  const init          = useERPStore((s) => s.init);
  const getDashboard  = useERPStore((s) => s.getDashboardData);
  const projects      = useERPStore((s) => s.projects);
  const isInitialized = useERPStore((s) => s.initialized);

  useEffect(() => { init(); }, [init]);

  const data = getDashboard();

  /* ── LOADING ── */
  if (!isInitialized) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header />
          <main className="erp-content space-y-6">
            <div className="erp-card h-48 skeleton"></div>
            <div className="grid grid-cols-6 gap-4">
              {[1,2,3,4,5,6].map(i => <div key={i} className="h-28 skeleton rounded-lg" />)}
            </div>
            <div className="grid grid-cols-3 gap-6">
              {[1,2,3].map(i => <div key={i} className="h-64 skeleton rounded-lg" />)}
            </div>
          </main>
        </div>
      </div>
    );
  }

  /* ── EMPTY ── */
  if (projects.length === 0) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
        <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
          <Header />
          <main className="erp-content">
            <div className="erp-empty py-20 flex flex-col items-center">
              <svg viewBox="0 0 24 24" className="h-16 w-16 text-slate-300 mb-4" fill="none" stroke="currentColor" strokeWidth="1">
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <h2 className="text-xl font-bold text-slate-900">Chưa có dự án nào</h2>
              <p className="text-slate-500 mt-1">Vui lòng tạo dự án mới để bắt đầu quản trị.</p>
            </div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />

      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header data={data} title="Tổng quan dự án" />

        <main className="erp-content space-y-[var(--sp-24)]">
          {/* ── PROJECT SUMMARY CARD (Top Block) ── */}
          <section className="erp-card erp-card-pad">
            <div className="flex flex-col lg:flex-row gap-[var(--sp-24)] items-start">
              {/* Project Image */}
              <div className="w-full lg:w-[280px] h-[180px] bg-[var(--bg-muted)] rounded-[6px] border border-[var(--border)] overflow-hidden relative">
                <img 
                  src="/modern_construction_project_1778222474187.png" 
                  alt="Project" 
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex-1 space-y-5">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-[24px] font-bold text-[var(--text-primary)] tracking-tight">{data.project?.name}</h2>
                  <span className="badge badge-success">Đang thi công</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-y-4 gap-x-12">
                  <div className="space-y-1">
                    <div className="t-label uppercase tracking-wider">Chủ đầu tư</div>
                    <div className="text-[14px] font-semibold text-[var(--text-primary)]">{data.project?.investor || 'Công ty TNHH ABC'}</div>
                  </div>
                  <div className="space-y-1">
                    <div className="t-label uppercase tracking-wider">Tổng giá trị hợp đồng</div>
                    <div className="text-[14px] font-bold text-[var(--text-primary)] tabular-nums">{formatVnd(data.project?.totalValue || 0)} VND</div>
                  </div>
                  <div className="space-y-1">
                    <div className="t-label uppercase tracking-wider">Thời gian thực hiện</div>
                    <div className="text-[14px] font-semibold text-[var(--text-primary)]">
                      {formatDate(data.project?.startDate)} — {formatDate(data.project?.endDate)}
                    </div>
                  </div>
                </div>

                {/* Progress Block */}
                <div className="pt-2 max-w-xl">
                  <div className="flex justify-between items-end mb-2">
                    <div className="t-label uppercase">Tiến độ tổng thể</div>
                    <div className="text-[15px] font-bold text-[var(--brand)]">{data.progress}%</div>
                  </div>
                  <div className="h-2.5 w-full bg-[var(--bg-muted)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--success)] rounded-full transition-all duration-700 ease-out" 
                      style={{ width: `${data.progress}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-2 text-[11px] font-medium text-[var(--text-secondary)]">
                    <span>Ngày bắt đầu: {formatDate(data.project?.startDate)}</span>
                    <span>Dự kiến kết thúc: {formatDate(data.project?.endDate)}</span>
                    <span>Số ngày đã qua: 172 / 365 ngày</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ── KPI GRID ── */}
          <KPISection data={data} />

          {/* ── CHARTS & ANALYTICS ── */}
          <ChartSection data={data} />

          {/* ── DATA TABLES ── */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-[var(--sp-24)]">
            <WBSTable data={data} />
            
            <div className="space-y-[var(--sp-24)]">
              <CostTable data={data} onEdit={setEditingCost} />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-[var(--sp-24)]">
                <DebtPanel data={data} />
                <ProfitPanel data={data} />
              </div>
            </div>
          </div>

          <footer className="py-8 text-center border-t border-[var(--border)] mt-8">
            <div className="text-[12px] font-medium text-[var(--text-muted)]">
              © 2024 Construction ERP Enterprise. All rights reserved.
            </div>
          </footer>
        </main>
      </div>

      <AddCostModal
        isOpen={!!editingCost}
        onClose={() => setEditingCost(null)}
        costRecord={editingCost}
      />
    </div>
  );
}
