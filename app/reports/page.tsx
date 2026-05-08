'use client';

import { useMemo, useState, useEffect } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';

export default function ReportsPage() {
  const [collapsed, setCollapsed] = useState(false);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const projects = useERPStore(state => state.projects);
  const init = useERPStore(state => state.init);
  const isInitialized = useERPStore(state => state.initialized);
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const getMonthlyReport = useERPStore(state => state.getMonthlyReport);
  const getAgingReport = useERPStore(state => state.getAgingReport);
  const locks = useERPStore(state => state.locks);
  const toggleLock = useERPStore(state => state.toggleLock);
  
  useEffect(() => {
    init();
  }, [init]);

  const monthlyData = useMemo(() => getMonthlyReport(currentProjectId), [currentProjectId, getMonthlyReport]);
  const agingData = useMemo(() => getAgingReport(currentProjectId), [currentProjectId, getAgingReport]);

  const agingCategories = ['0-30', '31-60', '61-90', '90+'];

  const handleExport = () => {
    const project = projects.find(p => p.id === currentProjectId);
    const filename = `BC_Thang_${project?.name || 'Project'}_${new Date().toISOString().split('T')[0]}.csv`;
    exportToCsv(filename, monthlyData);
  };

  const ml = collapsed ? 'var(--sidebar-width-sm)' : 'var(--sidebar-width)';

  if (!isInitialized) {
    return (
      <div className="erp-shell">
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
        <div className="erp-main" style={{ marginLeft: ml }}>
          <Header title="Báo cáo" />
          <main className="erp-content grid place-items-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent"></div>
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="erp-shell">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />
      <div className="erp-main" style={{ marginLeft: ml }}>
        <Header title="Báo cáo tài chính & Quản trị" />
        <main className="erp-content space-y-6">
          <div className="flex items-center justify-between">
            <div className="t-section-title">Phân tích dòng tiền & công nợ</div>
            <button 
              onClick={handleExport}
              className="btn btn-secondary"
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
              </svg>
              Xuất dữ liệu
            </button>
          </div>

          {/* Monthly Report Table */}
          <section className="erp-card">
            <div className="erp-panel-header">
              <span className="t-section-title">Kết quả kinh doanh theo tháng</span>
              <div className="flex items-center gap-2 text-[10px] text-slate-500 italic">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Kỳ đã chốt
              </div>
            </div>
            <div className="erp-table-wrap" style={{ borderRadius: 0, border: 'none', borderTop: '1px solid var(--border)' }}>
              <table className="erp-table">
                <thead>
                  <tr>
                    <th>Tháng</th>
                    <th className="text-right">Dòng tiền vào</th>
                    <th className="text-right">Dòng tiền ra</th>
                    <th className="text-right">Doanh thu</th>
                    <th className="text-right">Chi phí</th>
                    <th className="text-right">Lợi nhuận</th>
                    <th className="text-right">Số dư</th>
                    <th className="text-center">Chốt kỳ</th>
                  </tr>
                </thead>
                <tbody>
                  {monthlyData.map((row) => {
                    const isLocked = locks.includes(row.month);
                    return (
                      <tr key={row.month} className={isLocked ? 'bg-rose-500/5' : ''}>
                        <td className="font-bold">
                          <div className="flex items-center gap-2">
                            {isLocked && <svg viewBox="0 0 24 24" className="h-3 w-3 text-rose-500" fill="currentColor"><path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/></svg>}
                            {row.month}
                          </div>
                        </td>
                        <td className="text-right text-emerald-400">{formatVnd(row.cashIn)} ₫</td>
                        <td className="text-right text-rose-400">{formatVnd(row.cashOut)} ₫</td>
                        <td className="text-right" style={{ color: 'var(--text-secondary)' }}>{formatVnd(row.revenue)} ₫</td>
                        <td className="text-right" style={{ color: 'var(--text-secondary)' }}>{formatVnd(row.cost)} ₫</td>
                        <td className={`text-right font-bold ${row.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatVnd(row.profit)} ₫
                        </td>
                        <td className={`text-right font-extrabold ${row.runningBalance >= 0 ? 'text-blue-400' : 'text-rose-500'}`}>
                          {formatVnd(row.runningBalance)} ₫
                        </td>
                        <td className="text-center">
                          <button 
                            onClick={() => toggleLock(row.month)}
                            className={`badge ${isLocked ? 'badge-danger' : 'badge-muted cursor-pointer hover:bg-slate-700'}`}
                          >
                            {isLocked ? 'Mở khóa' : 'Chốt kỳ'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {monthlyData.length === 0 && (
                    <tr>
                      <td colSpan={8} className="erp-empty py-10 italic">Chưa có dữ liệu phát sinh</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          {/* Aging Report */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <section className="erp-card">
              <div className="erp-panel-header" style={{ background: 'rgba(16,185,129,0.05)' }}>
                <span className="t-section-title" style={{ color: 'var(--success)' }}>Tuổi nợ Phải thu</span>
              </div>
              <div className="erp-card-pad space-y-3">
                {agingCategories.map(cat => {
                  const items = agingData.filter(i => i.type === 'receivable' && i.category === cat);
                  const total = items.reduce((sum, i) => sum + i.amount, 0);
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                      <div>
                        <div className="t-kpi-label">{cat} ngày</div>
                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatVnd(total)} ₫</div>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{items.length} bản ghi</div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="erp-card">
              <div className="erp-panel-header" style={{ background: 'rgba(239,68,68,0.05)' }}>
                <span className="t-section-title" style={{ color: 'var(--danger)' }}>Tuổi nợ Phải trả</span>
              </div>
              <div className="erp-card-pad space-y-3">
                {agingCategories.map(cat => {
                  const items = agingData.filter(i => i.type === 'payable' && i.category === cat);
                  const total = items.reduce((sum, i) => sum + i.amount, 0);
                  return (
                    <div key={cat} className="flex items-center justify-between p-3 rounded-lg border" style={{ borderColor: 'var(--border)', background: 'var(--bg-muted)' }}>
                      <div>
                        <div className="t-kpi-label">{cat} ngày</div>
                        <div className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{formatVnd(total)} ₫</div>
                      </div>
                      <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{items.length} bản ghi</div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </main>
      </div>
    </div>
  );
}
