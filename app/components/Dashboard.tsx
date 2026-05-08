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

        <main className="erp-content" style={{ 
          padding: 'var(--sp-24)', 
          background: 'var(--bg-main)', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 'var(--sp-24)',
          minHeight: 'calc(100vh - var(--header-height))'
        }}>
          {/* ── ROW 1: PROJECT HERO ── */}
          <section className="erp-card" style={{ 
            padding: 'var(--sp-20)', 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            height: '110px',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-24)' }}>
              <div style={{ width: '100px', height: '70px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)', flexShrink: 0 }}>
                <img src="/modern_construction_project_1778222474187.png" alt="Project" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-8)', marginBottom: '4px' }}>
                  <h1 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                    {data.project?.name}
                  </h1>
                  <span className="badge badge-success" style={{ borderRadius: '2px', padding: '2px 8px', fontSize: '10px', fontWeight: 600 }}>{data.project?.status}</span>
                </div>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" /></svg>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Chủ đầu tư: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{(data.project as any).investor || 'An Gia Group'}</span></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Tổng giá trị hợp đồng: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{formatVnd(data.project?.totalValue || 0)}</span></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <svg viewBox="0 0 24 24" className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                    <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Thời gian thực hiện: <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>01/01/2024 - 31/12/2025</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div style={{ width: '300px', textAlign: 'right' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Tiến độ tổng thể</span>
                <span style={{ fontSize: '20px', fontWeight: 800, color: 'var(--success)', fontVariantNumeric: 'tabular-nums' }}>{data.progress}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-muted)', borderRadius: '100px', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${data.progress}%`, background: 'var(--success)' }} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '10px', color: 'var(--text-muted)' }}>
                <span>Bắt đầu: 01/01/2024</span>
                <span>Kết thúc: 31/12/2025</span>
              </div>
            </div>
          </section>

          {/* ── ROW 2: KPI GRID (6 Cards) ── */}
          <KPISection data={data} />

          {/* ── ROW 3: ANALYTICS (Budget, Cashflow, Progress Circle) ── */}
          <ChartSection data={data} />

          {/* ── ROW 4: OPERATIONAL GRID ── */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', 
            gap: 'var(--sp-24)', 
            alignItems: 'start' 
          }}>
            {/* LEFT: WBS Breakdown */}
            <WBSTable data={data} />
            
            {/* RIGHT: Contextual Panels */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--sp-24)' }}>
              <CostTable data={data} onEdit={setEditingCost} />
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-24)' }}>
                <DebtPanel data={data} />
                <ProfitPanel data={data} />
              </div>
            </div>
          </div>
        </main>
        <footer style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid var(--border)', 
          background: 'var(--bg-surface)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          height: '48px',
          flexShrink: 0
        }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)' }}>
            © 2026 Construction ERP Enterprise v2.4 — SAP Engine Integrated
          </div>
          <div style={{ display: 'flex', gap: '20px', fontSize: '11px', fontWeight: 700, color: 'var(--brand)' }}>
            <span style={{ cursor: 'pointer' }}>Hỗ trợ</span>
            <span style={{ cursor: 'pointer' }}>Tài liệu</span>
            <span style={{ cursor: 'pointer' }}>Phản hồi</span>
          </div>
        </footer>
      </div>

      <AddCostModal
        isOpen={!!editingCost}
        onClose={() => setEditingCost(null)}
        costRecord={editingCost}
      />
    </div>
  );
}
