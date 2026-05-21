'use client';

import { useEffect, useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { Project } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import AddProjectModal from '@/app/components/modals/AddProjectModal';
import StatusFilterDropdown from '@/app/components/StatusFilterDropdown';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PLANNED:     { label: 'Kế hoạch',      color: '#2563EB', bg: 'rgba(37,99,235,0.08)'  },
  ACTIVE:      { label: 'Thi công',      color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
  IN_PROGRESS: { label: 'Thi công',      color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
  COMPLETED:   { label: 'Hoàn thành',    color: '#0891B2', bg: 'rgba(8,145,178,0.08)'   },
  CLOSED:      { label: 'Đã quyết toán', color: '#64748B', bg: 'rgba(100,116,139,0.08)' },
  CANCELLED:   { label: 'Tạm dừng',      color: '#D97706', bg: 'rgba(217,119,6,0.08)'   },
};

const Badge = ({ status }: { status: string }) => {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: '#64748B', bg: '#F1F5F9' };
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 8px',
      borderRadius: '4px', fontSize: '11px', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.03em',
      background: cfg.bg, color: cfg.color,
    }}>
      {cfg.label}
    </span>
  );
};

const KPICard = ({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) => (
  <div style={{
    background: 'white', border: '1px solid var(--border)', borderRadius: '6px',
    padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '4px',
    borderLeft: `3px solid ${color ?? 'var(--brand)'}`,
  }}>
    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
    <div style={{ fontSize: '22px', fontWeight: 700, color: color ?? 'var(--text-primary)', lineHeight: 1.2 }}>{value}</div>
    {sub && <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>}
  </div>
);

export default function ProjectListScreen() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [isAddingProject, setIsAddingProject] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rawProjects = useERPStore(state => state.projects);
  const costs       = useERPStore(state => state.costs);
  const revenues    = useERPStore(state => state.revenues);
  const init        = useERPStore(state => state.init);
  const isInit      = useERPStore(state => state.initialized);

  useEffect(() => { init(); }, [init]);

  const projects = useMemo(() => {
    let list = rawProjects;
    if (statusFilter !== 'ALL') list = list.filter(p => p.status === statusFilter);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q) || (p.investor ?? '').toLowerCase().includes(q));
    }
    return list;
  }, [rawProjects, statusFilter, searchQuery]);

  // KPIs
  const totalValue     = rawProjects.reduce((s, p) => s + (p.totalValue ?? p.contractValue ?? 0), 0);
  const totalCosts     = costs.reduce((s, c) => s + c.amount, 0);
  const totalRevenue   = revenues.reduce((s, r) => s + r.amount, 0);
  const activeCount    = rawProjects.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length;
  const completedCount = rawProjects.filter(p => p.status === 'COMPLETED' || p.status === 'CLOSED').length;

  // Progress helper
  const getProgress = (p: Project) => {
    const start = p.startDate ? new Date(p.startDate).getTime() : 0;
    const end   = p.endDate   ? new Date(p.endDate).getTime()   : 0;
    const now   = Date.now();
    if (!start || !end || end <= start) return 0;
    return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
  };

  if (!isInit) return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Quản lý Dự án" />
        <main className="erp-content">
          <div className="erp-card h-64 skeleton rounded-[6px]" />
        </main>
      </div>
    </div>
  );

  return (
    <div className="erp-shell">
      <Sidebar collapsed={sidebarCollapsed} onToggle={() => setSidebarCollapsed(!sidebarCollapsed)} />
      <div className={`erp-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
        <Header title="Quản lý Dự án" />
        <main className="erp-content" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

          {/* Page Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 700, color: 'var(--text-primary)' }}>Danh mục Dự án</h2>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {rawProjects.length} dự án — Cập nhật: {new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
            <button
              onClick={() => setIsAddingProject(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px', height: '36px', padding: '0 16px',
                background: 'var(--brand)', color: 'white', border: 'none', borderRadius: '6px',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              <svg viewBox="0 0 24 24" style={{ height: '14px', width: '14px' }} fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
              Thêm dự án
            </button>
          </div>

          {/* KPI Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '12px' }}>
            <KPICard label="Tổng số dự án"     value={String(rawProjects.length)}        sub={`${activeCount} đang thi công`}  color="var(--brand)"   />
            <KPICard label="Đang thi công"      value={String(activeCount)}               sub={`${completedCount} hoàn thành`}  color="var(--success)" />
            <KPICard label="Tổng giá trị HĐ"   value={`${(totalValue/1e9).toFixed(2)} tỷ`} sub="VND"                          color="var(--brand)"   />
            <KPICard label="Tổng chi phí"       value={`${(totalCosts/1e9).toFixed(2)} tỷ`} sub="Toàn bộ dự án"               color="var(--danger)"  />
            <KPICard label="Tổng doanh thu"     value={`${(totalRevenue/1e9).toFixed(2)} tỷ`} sub="Đã ghi nhận"               color="var(--success)" />
          </div>

          {/* Filter Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: '300px' }}>
              <svg viewBox="0 0 24 24" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', height: '14px', width: '14px', color: 'var(--text-muted)', pointerEvents: 'none' }} fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Tìm kiếm dự án, chủ đầu tư..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                style={{
                  width: '100%', height: '36px', paddingLeft: '32px', paddingRight: '12px',
                  border: '1px solid var(--border)', borderRadius: '6px', fontSize: '13px',
                  color: 'var(--text-primary)', outline: 'none', background: 'white',
                }}
              />
            </div>

            {/* Status Filter - Using Enterprise Dropdown */}
            <StatusFilterDropdown
              value={statusFilter}
              onChange={setStatusFilter}
            />

            <div style={{ marginLeft: 'auto', fontSize: '12px', color: 'var(--text-secondary)' }}>
              {projects.length} kết quả
            </div>
          </div>

          {/* Main Table */}
          <div style={{ background: 'white', border: '1px solid var(--border)', borderRadius: '6px', overflow: 'visible' }}>
            <div style={{ borderBottom: '1px solid var(--border)', padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FAFBFC' }}>
              <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>Danh sách Dự án ({projects.length})</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button style={{ height: '28px', padding: '0 10px', border: '1px solid var(--border)', borderRadius: '4px', background: 'white', fontSize: '12px', color: 'var(--text-secondary)', cursor: 'pointer' }}>
                  Xuất Excel
                </button>
              </div>
            </div>
            <div style={{ overflowX: 'auto', position: 'relative', zIndex: 1 }}>
              <table className="erp-table zebra" style={{ minWidth: '900px' }}>
                <thead>
                  <tr>
                    <th style={{ width: '32px' }}>#</th>
                    <th>Tên dự án</th>
                    <th>Chủ đầu tư</th>
                    <th className="text-right">Giá trị HĐ (VND)</th>
                    <th>Ngày bắt đầu</th>
                    <th>Ngày kết thúc</th>
                    <th style={{ width: '100px' }}>Tiến độ</th>
                    <th style={{ width: '120px' }}>Trạng thái</th>
                    <th className="text-center" style={{ width: '80px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((project, idx) => {
                    const progress = getProgress(project);
                    return (
                      <tr key={project.id}>
                        <td style={{ color: 'var(--text-muted)', fontSize: '11px', textAlign: 'center' }}>{idx + 1}</td>
                        <td>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '13px' }}>{project.name}</div>
                          <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '1px' }}>
                            ID: {project.id.slice(0, 8).toUpperCase()}
                          </div>
                        </td>
                        <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{project.investor || '—'}</td>
                        <td className="text-right text-money" style={{ color: 'var(--brand)' }}>
                          {formatVnd(project.totalValue ?? project.contractValue ?? 0)}
                        </td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(project.startDate)}</td>
                        <td style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{formatDate(project.endDate)}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <div style={{ flex: 1, height: '5px', background: 'var(--bg-muted)', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{
                                height: '100%', width: `${progress}%`, borderRadius: '3px',
                                background: progress >= 80 ? 'var(--success)' : progress >= 50 ? 'var(--brand)' : 'var(--warning)',
                                transition: 'width 0.3s',
                              }} />
                            </div>
                            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>{progress}%</span>
                          </div>
                        </td>
                        <td><Badge status={project.status} /></td>
                        <td className="text-center">
                          <button
                            onClick={() => setEditingProject(project)}
                            style={{
                              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                              height: '28px', width: '28px', borderRadius: '4px',
                              border: '1px solid var(--border)', background: 'white', cursor: 'pointer',
                              color: 'var(--text-secondary)',
                            }}
                            onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--brand)'; e.currentTarget.style.color = 'var(--brand)'; }}
                            onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}
                          >
                            <svg viewBox="0 0 24 24" style={{ height: '13px', width: '13px' }} fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {projects.length === 0 && (
                    <tr>
                      <td colSpan={9} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--text-muted)', fontSize: '13px', fontStyle: 'italic' }}>
                        Chưa có dự án nào. Nhấn &quot;Thêm dự án&quot; để bắt đầu.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Table Footer */}
            {projects.length > 0 && (
              <div style={{ borderTop: '1px solid var(--border)', padding: '8px 16px', background: '#FAFBFC', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  Hiển thị {projects.length} / {rawProjects.length} dự án
                </span>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[
                    { label: 'Tổng giá trị HĐ', value: formatVnd(totalValue), color: 'var(--brand)' },
                    { label: 'Chi phí', value: formatVnd(totalCosts), color: 'var(--danger)' },
                    { label: 'Doanh thu', value: formatVnd(totalRevenue), color: 'var(--success)' },
                  ].map(s => (
                    <div key={s.label} style={{
                      padding: '3px 10px', borderRadius: '4px', background: 'white', border: '1px solid var(--border)',
                      fontSize: '11px', color: 'var(--text-secondary)',
                    }}>
                      {s.label}: <strong style={{ color: s.color }}>{s.value}</strong>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Status Summary Row */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[
              { status: 'PLANNED',   count: rawProjects.filter(p => p.status === 'PLANNED').length   },
              { status: 'ACTIVE',    count: rawProjects.filter(p => p.status === 'ACTIVE' || p.status === 'IN_PROGRESS').length },
              { status: 'COMPLETED', count: rawProjects.filter(p => p.status === 'COMPLETED').length },
              { status: 'CLOSED',    count: rawProjects.filter(p => p.status === 'CLOSED').length    },
            ].map(({ status, count }) => {
              const cfg = STATUS_CONFIG[status];
              return (
                <div key={status} style={{
                  background: 'white', border: '1px solid var(--border)', borderRadius: '6px',
                  padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{cfg.label}</div>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: cfg.color, marginTop: '2px' }}>{count}</div>
                  </div>
                  <div style={{ height: '36px', width: '36px', borderRadius: '6px', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg viewBox="0 0 24 24" style={{ height: '16px', width: '16px', color: cfg.color }} fill="none" stroke="currentColor" strokeWidth="2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
                    </svg>
                  </div>
                </div>
              );
            })}
          </div>

        </main>
      </div>

      <AddProjectModal
        isOpen={isAddingProject || !!editingProject}
        onClose={() => { setIsAddingProject(false); setEditingProject(null); }}
        project={editingProject}
      />
    </div>
  );
}
