'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useERPStore } from '@/store/erpStore';
import Sidebar from './Sidebar';
import Header from './Header';
import WBSTable from './WBSTable';
import CostTable from './CostTable';
import { DebtPanel, ProfitPanel } from './DebtPanel';
import AddCostModal from './modals/AddCostModal';
import { CostRecord, CostType, Project } from '../types';
import { formatVnd, WBSBudgetRow } from './dashboard-data';
import { ERP_TERMINOLOGY } from '@/app/utils/table-constants';
import { useProjectsQuery, useProjectStatsQuery } from '@/services/queries/useProjects';
import { useIntelligenceQuery } from '@/services/queries/useIntelligence';
import ExecutiveActionCockpit from './ExecutiveActionCockpit';
import KPISection from './KPISection';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import { useExecutiveSummaryQuery } from '@/services/queries/useWorkspace';
import ActionCenter from './workspace/ActionCenter';
import GuidanceBanner from './workspace/GuidanceBanner';
import ActivityStream from './workspace/ActivityStream';

const costType_LABELS: Record<string, string> = {
  material: 'Vật tư',
  labor: 'Nhân công',
  equipment: 'Máy thi công',
  subcontract: 'Thầu phụ',
  other: 'Khác'
};

export default function Dashboard() {
  const { currentProjectId, sidebarCollapsed, setCurrentProject } = useERPStore();
  const router = useRouter();

  // Queries
  const { data: paginatedData, isLoading: isLoadingProjects, isError: isErrorProjects, refetch: refetchProjects } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, refetch: refetchStats } = useProjectStatsQuery(currentProjectId);
  const { data: intelligence, isLoading: isLoadingIntel } = useIntelligenceQuery(currentProjectId);
  const { data: costs = [], isLoading: isLoadingCosts, isError: isErrorCosts, refetch: refetchCosts } = useCostsQuery(currentProjectId);
  const { data: wbsData, isLoading: isLoadingWBS, isError: isErrorWBS, refetch: refetchWBS } = useWBSQuery(currentProjectId);
  const { data: executiveData } = useExecutiveSummaryQuery(currentProjectId);

  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);

  // STABILITY FIX: Auto-select first project if none selected to prevent "idle loading"
  useEffect(() => {
    if (!currentProjectId && projects.length > 0) {
      setCurrentProject(projects[0].id);
    }
  }, [projects, currentProjectId, setCurrentProject]);

  const isLoading = isLoadingProjects || (currentProjectId && projects.length > 0 && (isLoadingStats || isLoadingCosts || isLoadingWBS));
  const isError = isErrorProjects || (currentProjectId && (isErrorStats || isErrorCosts || isErrorWBS));

  const handleRetry = () => {
    refetchProjects();
    if (currentProjectId) {
      refetchStats();
      refetchCosts();
      refetchWBS();
    }
  };

  const data = useMemo(() => {
    const project = projects.find((p: Project) => p.id === currentProjectId) || projects[0] || { id: '', name: 'No Project', contractValue: 0, status: 'PLANNED' };
    const wbsTree = wbsData?.tree || [];

    const fallbackData = {
      project,
      budget: [],
      costs,
      wbsTree,
      revenue: Number(project.contractValue || 0),
      receivable: { total: 0, paid: 0, remaining: 0, overdue: 0 },
      payable: { total: 0, paid: 0, remaining: 0, overdue: 0 },
      costByType: [],
      cashFlow: [],
      wbsRows: wbsTree as unknown as WBSBudgetRow[],
      totalBudget: 0,
      totalCost: 0,
      progress: 0,
      daysElapsed: 0,
      durationDays: 0,
    };

    if (!stats) return fallbackData;

    const costByTypeArr = Object.entries(stats.costByType || {}).map(([type, value]) => ({
      type: type as CostType,
      label: costType_LABELS[type as CostType] || type.charAt(0).toUpperCase() + type.slice(1),
      value: value as number,
      color: type === 'material' ? '#3b82f6' : type === 'labor' ? '#10b981' : '#f59e0b'
    }));

    return {
      ...fallbackData,
      project: {
        ...project,
        totalValue: Number(project.contractValue || stats.totalRevenue || 0),
      },
      revenue: Number(stats.totalRevenue || project.contractValue || 0),
      receivable: {
        total: stats.totalInvoiced,
        paid: stats.totalPaidInvoice,
        remaining: stats.totalRemainingInvoice,
        overdue: stats.overdueInvoices,
      },
      payable: {
        total: stats.totalCost,
        paid: stats.paidCost,
        remaining: stats.unpaidCost,
        overdue: 0,
      },
      totalBudget: stats.totalBudget,
      totalCost: stats.totalCost,
      costByType: costByTypeArr,
      progress: stats.taskProgress,
      version: stats.version,
    };
  }, [currentProjectId, projects, stats, costs, wbsData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex">
        <Sidebar activeItem="overview" />
        <div className="flex-1">
          <div className="h-[74px] border-b border-[var(--border)] bg-[var(--header-bg)] animate-pulse" />
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(idx => <div key={idx} className="h-32 rounded-2xl bg-[var(--secondary)] animate-pulse" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 rounded-2xl bg-[var(--secondary)] animate-pulse" />
              <div className="h-96 rounded-2xl bg-[var(--secondary)] animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex">
        <Sidebar activeItem="overview" />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-6 mx-auto h-20 w-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 grid place-items-center">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-2">Lỗi kết nối dữ liệu</h2>
            <p className="text-sm text-[var(--text-muted)] mb-8">Không thể kết nối tới máy chủ API. Vui lòng kiểm tra lại đường truyền mạng hoặc liên hệ quản trị viên.</p>
            <button
              onClick={handleRetry}
              className="erp-btn bg-slate-800 text-white px-8 py-3 hover:bg-slate-700"
            >
              Thử lại ngay
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Handle Empty State
  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
        <Sidebar activeItem="overview" />
        <main className="flex-1 flex flex-col">
          <Header data={data} />
          <div className="flex-1 grid place-items-center p-8 text-center animate-fade-in">
            <div className="max-w-md">
              <div className="mb-6 mx-auto h-24 w-24 rounded-full bg-[var(--secondary)] grid place-items-center border border-[var(--border)] shadow-2xl">
                <svg viewBox="0 0 24 24" className="h-10 w-10 text-[var(--text-muted)]" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 21V8l5-3 5 3v13M14 21V11l6 3v7M7 11h2M7 15h2" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">Chưa có dự án nào</h2>
              <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-8 leading-relaxed">Hãy khởi tạo dự án đầu tiên để bắt đầu quản lý chi phí & tiến độ.</p>
              <button
                onClick={() => router.push('/projects')}
                className="erp-btn bg-blue-600 text-white px-8 py-3 hover:bg-blue-500 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
              >
                Tạo hồ sơ dự án
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const kpis = [
    { label: ERP_TERMINOLOGY.FINANCE.REVENUE, value: data.revenue, color: 'text-blue-400', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Chi phí thực tế', value: data.payable.total, color: 'text-rose-400', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.67 1M12 17c-1.12 0-2.1-.425-2.69-1.041' },
    { label: 'Lợi nhuận gộp', value: data.revenue - data.payable.total, color: 'text-emerald-400', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.72 0 3.347.433 4.774 1.2m0 0a9.96 9.96 0 013.186 3.645m-9.214 6.42a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243z' },
    { label: 'Công nợ Phải thu', value: data.receivable.total, color: 'text-sky-400', icon: 'M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z' },
    { label: 'Công nợ Phải trả', value: data.payable.remaining, color: 'text-amber-400', icon: 'M3 10h18M7 15h1m4 0h1m4 0h1' },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="overview" />

      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header data={data} />

        <div className="erp-content-container animate-fade-in space-y-8">
          {/* ─── LEVEL 1: Financial KPIs (Construction Logic) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5">
            {kpis.map((kpi, idx) => (
              <div key={idx} className="erp-kpi-card group cursor-default">
                <div className="relative z-10 flex flex-col h-full gap-5">
                  <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary)] border border-[var(--border)] ${kpi.color} group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={kpi.icon} /></svg>
                    </div>
                    <div className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em]">Tài chính</div>
                  </div>
                  <div className="mt-auto">
                    <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">{kpi.label}</div>
                    <div className="flex items-baseline gap-1.5">
                      <div className="text-xl font-black text-[var(--text-primary)] tabular-nums tracking-tight truncate leading-none">{formatVnd(kpi.value)}</div>
                      <div className="text-[10px] font-bold text-[var(--text-tertiary)] shrink-0">VND</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* ─── LEVEL 2: Operational Status Row (Refined) ─── */}
          {executiveData && (
            <div className="flex flex-wrap items-center gap-6 p-4 bg-[var(--card)] rounded-2xl border border-[var(--border)] shadow-[var(--erp-card-shadow)] backdrop-blur-md relative overflow-hidden group">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500/[0.03] to-transparent pointer-events-none" />

              <div className="flex items-center gap-4 px-4 border-r border-[var(--divider)] relative z-10">
                <div className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] leading-tight">Tình trạng<br />dự án</div>
                <div className="text-2xl font-black text-blue-500 tracking-tighter">{executiveData.governance.healthScore}%</div>
              </div>

              <div className="flex items-center gap-4 px-4 border-r border-[var(--divider)] relative z-10">
                <div className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] leading-tight">Cảnh báo<br />rủi ro</div>
                <div className="text-2xl font-black text-orange-500 tracking-tighter">{executiveData.portfolio.atRiskProjects}</div>
              </div>

              <div className="flex-1 min-w-[300px] relative z-10">
                {executiveData?.executiveSummary.topRisks?.[0]?.riskScore > 60 ? (
                  <GuidanceBanner
                    title="Cảnh báo hệ thống"
                    message={executiveData.executiveSummary.topRisks[0].ux.guidance}
                    severity="error"
                    actions={[{ label: 'Tiến hành xử lý', onClick: () => { }, primary: true }]}
                  />
                ) : (
                  <div className="flex items-center gap-3 text-[11px] font-bold text-emerald-500 px-4 py-2 bg-emerald-500/5 rounded-xl border border-emerald-500/10 shadow-sm">
                    <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                    Tính nhất quán tài chính đạt tiêu chuẩn. Không có rủi ro vận hành khẩn cấp.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ─── LEVEL 3: Primary Operational Workspace ─── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* LEFT: Execution & Progress (8 cols) */}
            <div className="lg:col-span-8 space-y-8">
              {/* Construction Progress Table */}
              <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[var(--erp-card-shadow)] overflow-hidden transition-all duration-300 hover:shadow-[var(--erp-hover-shadow)]">
                <div className="px-6 py-5 border-b border-[var(--divider)] flex items-center justify-between bg-gradient-to-r from-[var(--secondary)]/30 to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]" />
                    <h3 className="text-[11px] font-black text-[var(--text-primary)] tracking-[0.2em] uppercase">Theo dõi hạng mục thi công (WBS)</h3>
                  </div>
                  <div className="text-[10px] font-bold text-[var(--text-tertiary)] bg-[var(--secondary)] px-3 py-1 rounded-lg border border-[var(--border)]">Cập nhật: {new Date().toLocaleDateString('vi-VN')}</div>
                </div>
                {/* Executive Decision Layer */}
            {intelligence && (
              <div className="mb-8">
                <ExecutiveActionCockpit 
                  data={intelligence} 
                  onAction={(action) => console.log('Action Executed:', action)}
                  onAcknowledge={(id) => console.log('Anomaly Acknowledged:', id)}
                />
              </div>
            )}

            <div className="mb-8">
              <KPISection data={stats} />
            </div>
                <div className="p-6">
                  <WBSTable data={data.wbsRows} />
                </div>
              </section>

              {/* Construction Cost Journal (Full Width of column) */}
              <section className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[var(--erp-card-shadow)] overflow-hidden transition-all duration-300 hover:shadow-[var(--erp-hover-shadow)]">
                <div className="px-6 py-5 border-b border-[var(--divider)] flex items-center justify-between bg-gradient-to-r from-rose-500/[0.05] to-transparent">
                  <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-rose-500 rounded-full shadow-[0_0_10px_rgba(244,63,94,0.5)]" />
                    <h3 className="text-[11px] font-black text-[var(--text-primary)] tracking-[0.2em] uppercase">Nhật ký chi phí</h3>
                  </div>
                </div>
                <div className="p-6">
                  <CostTable costs={data.costs} onEdit={setEditingCost} />
                </div>
              </section>

              {/* Operational Activity Stream (Full Width of column) */}
              {executiveData?.executiveSummary.recentActivities && (
                <div className="h-auto">
                  <ActivityStream activities={executiveData.executiveSummary.recentActivities} />
                </div>
              )}
            </div>

            {/* RIGHT: Coordination & Financial Health (4 cols) */}
            <div className="lg:col-span-4 space-y-8">
              {/* Action Center (Operational Coordination) */}
              {executiveData?.executiveSummary.actionCenter && (
                <ActionCenter
                  tasks={executiveData.executiveSummary.actionCenter}
                  onAction={(id, act) => console.log(`Action ${act} on ${id}`)}
                />
              )}

              {/* Financial Health Grouping (Consolidated & Compact) */}
              <div className="bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-[var(--erp-card-shadow)] p-6 space-y-8 relative overflow-hidden transition-all duration-300 hover:shadow-[var(--erp-hover-shadow)]">
                <div className="absolute top-0 right-0 p-8 opacity-[0.03] pointer-events-none">
                  <svg viewBox="0 0 24 24" className="h-32 w-32" fill="currentColor"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6" /></svg>
                </div>

                <div className="flex items-center gap-3 relative z-10">
                  <div className="w-1.5 h-6 bg-[var(--text-primary)] rounded-full shadow-[0_0_10px_rgba(255,255,255,0.2)]" />
                  <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.2em]">Tình trạng tài chính</h3>
                </div>

                <div className="space-y-8 relative z-10">
                  <div className="scale-100 origin-top">
                    <DebtPanel receivable={data.receivable} payable={data.payable} />
                  </div>
                  <div className="h-px bg-[var(--divider)]" />
                  <div className="scale-100 origin-top">
                    <ProfitPanel
                      revenue={data.revenue}
                      cost={data.payable.total}
                      margin={data.progress}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {editingCost && (
        <AddCostModal
          isOpen={!!editingCost}
          onClose={() => setEditingCost(null)}
          costRecord={editingCost.id ? editingCost : undefined}
        />
      )}
    </div>
  );
}
