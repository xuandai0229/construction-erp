'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useERPStore } from '@/store/erpStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Header from './Header';
import WBSTable from './WBSTable';
import CostTable from './CostTable';
import AddCostModal from './modals/AddCostModal';
import { CostRecord, Project } from '../types';
import { formatVnd, formatKpiValue } from './dashboard-data';
import { ERP_TERMINOLOGY } from '@/app/utils/table-constants';
import { useProjectsQuery, useProjectStatsQuery } from '@/services/queries/useProjects';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';
import ExecutiveRiskCenter from './ExecutiveRiskCenter';

// Visual Analytics Imports
import {
  BudgetAllocationChart,
  CashflowTrendChart,
  ProjectProgressChart,
  BOQVsActualChart,
  CostDistributionChart,
  ResourceUtilizationChart,
  DebtPaymentChart,
  ProfitabilityChart
} from './VisualAnalytics';

// Strategic AI Chat Assistant & Executive Intelligence
import AIChatBox from './AIChatBox';

export default function Dashboard() {
  const { currentProjectId, sidebarCollapsed, setCurrentProject } = useERPStore();
  const router = useRouter();
  const queryClient = useQueryClient();

  // Core Data Queries for Operational Core Tables
  const { data: paginatedData, isLoading: isLoadingProjects, isError: isErrorProjects, refetch: refetchProjects } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, refetch: refetchStats } = useProjectStatsQuery(currentProjectId);
  const { data: costs = [], isLoading: isLoadingCosts, isError: isErrorCosts, refetch: refetchCosts } = useCostsQuery(currentProjectId);
  const { data: wbsData, isLoading: isLoadingWBS, isError: isErrorWBS, refetch: refetchWBS } = useWBSQuery(currentProjectId);

  // Authoritative Python AI Analytics Engine Query (Aggregating Forecasting, Margins, Risks)
  const { data: analyticsData, isLoading: isLoadingAnalytics, refetch: refetchAnalytics } = useQuery({
    queryKey: ['pythonAnalytics', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return null;
      const res = await fetch(`/api/analytics?projectId=${currentProjectId}&action=all`);
      const json = await res.json();
      return json.success ? json.data : null;
    },
    enabled: !!currentProjectId
  });

  // Core Action Center Tasks Query
  const { data: actionTasks = [], refetch: refetchActionTasks } = useQuery({
    queryKey: ['actionTasks', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return [];
      const res = await fetch(`/api/workspace/action-center?projectId=${currentProjectId}`);
      const json = await res.json();
      return json.success ? json.data : [];
    },
    enabled: !!currentProjectId
  });

  const [editingCost, setEditingCost] = useState<CostRecord | null>(null);

  // STABILITY FIX: Auto-select first project if none selected or if selected project is stale
  useEffect(() => {
    if (projects.length > 0) {
      const exists = projects.some((p: any) => p.id === currentProjectId);
      if (!currentProjectId || !exists) {
        setCurrentProject(projects[0].id);
      }
    }
  }, [projects, currentProjectId, setCurrentProject]);

  // REAL-TIME SYNCHRONIZATION VIA SSE
  useEffect(() => {
    const eventSource = new EventSource(`/api/stream${currentProjectId ? `?projectId=${currentProjectId}` : ''}`);

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        // Refresh React Query caches on any relevant financial event
        console.log('[RealTime] Invalidate caches for event:', data.type);
        queryClient.invalidateQueries({ queryKey: ['pythonAnalytics', currentProjectId] });
        queryClient.invalidateQueries({ queryKey: ['projectStats', currentProjectId] });
        queryClient.invalidateQueries({ queryKey: ['costs', currentProjectId] });
        queryClient.invalidateQueries({ queryKey: ['wbs', currentProjectId] });
        queryClient.invalidateQueries({ queryKey: ['actionTasks', currentProjectId] });
      } catch (e) {
        // Ignore parse errors from keep-alive or malformed data
      }
    };

    return () => {
      eventSource.close();
    };
  }, [currentProjectId, queryClient]);

  const isLoading = isLoadingProjects || (currentProjectId && projects.length > 0 && (isLoadingStats || isLoadingCosts || isLoadingWBS || isLoadingAnalytics));
  const isError = isErrorProjects || (currentProjectId && (isErrorStats || isErrorCosts || isErrorWBS));

  const handleRetry = () => {
    refetchProjects();
    refetchAnalytics();
    refetchActionTasks();
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
      project: {
        ...project,
        totalValue: Number(project.totalValue ?? project.contractValue ?? 0),
      },
      budget: [] as any[],
      costs,
      wbsTree,
      revenue: 0,  // Recognized revenue = 0 when no stats loaded (NOT contractValue)
      receivable: { total: 0, paid: 0, remaining: 0, overdue: 0 },
      payable: { total: 0, paid: 0, remaining: 0, overdue: 0 },
      costByType: [] as any[],
      cashFlow: [] as any[],
      wbsRows: wbsTree as any[],
      totalBudget: 0,
      totalCost: 0,
      progress: 0,
      daysElapsed: 0,
      durationDays: 0,
    };

    if (!stats) return fallbackData;

    return {
      ...fallbackData,
      project: {
        ...project,
        totalValue: Number(project.contractValue || 0),
      },
      revenue: Number(stats.totalRevenue || 0),  // Recognized revenue from invoices only
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
      progress: stats.taskProgress,
      version: stats.version,
    };
  }, [currentProjectId, projects, stats, costs, wbsData]);



  // Bind top KPI metrics directly to authoritative Python/JS analytics engine
  const activeKpis = analyticsData?.kpis || data;
  const activeAnalytics = {
    boq: analyticsData?.boq || { costByType: data.costByType || [] },
    cashflow: analyticsData?.cashflow || { trend: data.cashFlow || [], forecast: [] },
    kpis: activeKpis,
    forecast: analyticsData?.forecast || []
  };
  const kpiCards = [
    { label: ERP_TERMINOLOGY.FINANCE.REVENUE, value: activeKpis.totalRevenue, color: 'text-blue-400', tag: 'Tài chính', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Tổng dự toán BOQ', value: activeKpis.totalBudget, color: 'text-sky-400', tag: 'Tài chính', icon: 'M7 3h10v18H7zM10 7h4M10 11h4M10 15h2' },
    { label: 'Chi phí thực tế', value: activeKpis.totalCost, color: 'text-rose-400', tag: 'Tài chính', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.67 1M12 17c-1.12 0-2.1-.425-2.69-1.041' },
    { label: 'Lợi nhuận gộp', value: activeKpis.grossProfit, color: activeKpis.grossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400', tag: activeKpis.grossProfit >= 0 ? 'Lãi' : 'Lỗ', icon: 'M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A10.003 10.003 0 0012 3c1.72 0 3.347.433 4.774 1.2m0 0a9.96 9.96 0 013.186 3.645m-9.214 6.42a3 3 0 11-4.243-4.243 3 3 0 014.243 4.243z' },
    { label: 'Công nợ Phải thu', value: activeKpis.outstandingReceivable ?? activeKpis.totalInvoiced ?? 0, color: 'text-cyan-400', tag: 'Công nợ', icon: 'M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z' },
    { label: 'Công nợ Phải trả', value: activeKpis.accruedCost ?? activeKpis.unpaidCost ?? 0, color: 'text-amber-400', tag: 'Công nợ', icon: 'M3 10h18M7 15h1m4 0h1m4 0h1' },
  ];

  // Map Python/JS analytics results to Intelligence Snapshot for the Cockpit
  const intelligenceSnapshot = useMemo(() => {
    if (!analyticsData) return null;
    return {
      projectId: activeKpis.id || 'N/A',
      timestamp: new Date(),
      version: activeKpis.version || 1,
      integrity: { isValid: true, checksum: 'verified', syncStatus: 'SYNCED', lastValidation: new Date() },
      operational: {
        activeContractors: analyticsData.boq?.topContractors?.length || 0,
        criticalPathDelays: analyticsData.kpis?.spi < 0.95 ? 1 : 0,
        pendingApprovals: 0,
        resourceUtilization: 85
      },
      health: {
        score: analyticsData.kpis?.healthScore || 100,
        status: analyticsData.kpis?.healthStatus || 'STABLE',
        components: { dataIntegrity: 98, reconciliation: 100, operationalStability: 95, budgetAdherence: 100 },
        lastUpdated: new Date()
      },
      anomalies: analyticsData.risk?.risks?.map((r: any, idx: number) => ({
        id: `anom-${idx}`,
        type: r.type,
        severity: r.severity,
        message: r.message,
        rootCause: {
          driver: r.type,
          explanation: r.details?.[0] || '',
          operationalImpact: 'Ảnh hưởng trực tiếp tiến độ/ngân sách',
          financialImpact: 'Rủi ro tài chính tiềm ẩn'
        },
        recommendations: analyticsData.insights?.recommendations || []
      })) || [],
      reality: {
        totalRevenue: activeKpis.totalRevenue || 0,
        actualCost: activeKpis.totalCost || 0,
        grossProfit: activeKpis.grossProfit || 0,
        grossMargin: activeKpis.grossMargin || 0,
      },
      exposure: {
        totalCostExposure: activeKpis.totalCost || 0,
        pendingCost: activeKpis.accruedCost || 0,
        budgetUtilization: activeKpis.costOverrunPct || 0,
        isOverBudget: activeKpis.budgetVariance < 0
      },
      insights: analyticsData.insights?.insights || [],
      recommendations: analyticsData.insights?.recommendations || []
    } as any;
  }, [analyticsData, activeKpis]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex">
        <Sidebar activeItem="overview" />
        <div className="flex-1 flex flex-col h-screen overflow-hidden">
          <div className="h-[74px] border-b border-[var(--border)] bg-[var(--header-bg)] flex items-center px-8">
            <div className="w-48 h-6 bg-[var(--secondary)] rounded-md animate-pulse"></div>
          </div>
          <div className="flex-1 p-8 overflow-y-auto space-y-3">
            {/* KPI Row - 6 columns to match actual UI */}
            <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-5">
              {[1, 2, 3, 4, 5, 6].map(idx => (
                <div key={idx} className="h-[120px] rounded-lg bg-[var(--card)] border border-[var(--border)] p-4 flex flex-col justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[var(--secondary)] animate-pulse"></div>
                  <div className="space-y-2">
                    <div className="w-16 h-3 bg-[var(--secondary)] rounded animate-pulse"></div>
                    <div className="w-24 h-6 bg-[var(--secondary)] rounded animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Analytics Triptych - seamless surface */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] h-[320px] flex overflow-hidden">
              <div className="flex-1 p-5"><div className="w-full h-full bg-[var(--secondary)] rounded-md animate-pulse"></div></div>
              <div className="flex-1 p-5 border-l border-[var(--divider)]"><div className="w-full h-full bg-[var(--secondary)] rounded-md animate-pulse"></div></div>
              <div className="flex-1 p-5 border-l border-[var(--divider)]"><div className="w-full h-full bg-[var(--secondary)] rounded-md animate-pulse"></div></div>
            </div>

            {/* WBS Table row */}
            <div className="h-[400px] rounded-lg border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="w-48 h-4 bg-[var(--secondary)] rounded-md animate-pulse mb-6"></div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map(idx => <div key={idx} className="w-full h-10 bg-[var(--secondary)] rounded animate-pulse"></div>)}
              </div>
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

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
        <Sidebar activeItem="overview" />
        <main className="flex-1 flex flex-col">
          <Header data={data as any} />
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

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="overview" />

      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header data={data as any} />

        <div className="erp-content-container animate-fade-in space-y-3">

          {/* ─── LEVEL 1: Financial KPIs (6 unified columns matching visual target) ─── */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-6 gap-5">
            {kpiCards.map((kpi, idx) => {
              const { valueStr, unitStr } = formatKpiValue(kpi.value);
              const sparklines = [
                'M0,25 Q15,10 30,18 T60,8 T90,20 T120,5', 
                'M0,15 Q15,15 30,22 T60,18 T90,12 T120,12', 
                'M0,10 Q15,25 30,20 T60,28 T90,15 T120,25', 
                'M0,28 Q15,20 30,25 T60,12 T90,15 T120,8', 
                'M0,18 Q15,22 30,15 T60,20 T90,10 T120,18', 
                'M0,20 Q15,10 30,25 T60,15 T90,22 T120,10', 
              ];
              const strokeColor = kpi.color === 'text-emerald-400' || kpi.color === 'text-emerald-500' 
                ? '#10b981' 
                : kpi.color === 'text-rose-400' 
                  ? '#f43f5e' 
                  : '#3b82f6';
              return (
                <div key={idx} className="erp-kpi-card group cursor-default relative overflow-hidden transition-all duration-[180ms] hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(59,130,246,0.1)] hover:border-blue-500/20">
                  {/* Subtle Sparkline at base */}
                  <div className="absolute bottom-0 left-0 right-0 h-6 overflow-hidden pointer-events-none opacity-20 group-hover:opacity-60 transition-opacity duration-300">
                    <svg viewBox="0 0 120 30" className="w-full h-full" preserveAspectRatio="none">
                      <path
                        d={sparklines[idx % sparklines.length]}
                        fill="none"
                        stroke={strokeColor}
                        strokeWidth="1.2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <div className="relative z-10 flex flex-col h-full gap-5">
                    <div className="flex items-center justify-between">
                      <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary)] border border-[var(--border)] ${kpi.color} group-hover:scale-110 transition-all duration-300 shadow-sm`}>
                        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d={kpi.icon} /></svg>
                      </div>
                      <div className={`text-[9px] font-black uppercase tracking-[0.2em] ${kpi.tag === 'Lỗ' ? 'text-rose-400' : 'text-[var(--text-tertiary)]'}`}>{kpi.tag}</div>
                    </div>
                    <div className="mt-auto">
                      <div className="text-[10px] font-black uppercase tracking-[0.15em] text-[var(--text-tertiary)] mb-2">{kpi.label}</div>
                      <div className="flex items-baseline gap-1.5">
                        <div className="text-xl font-black text-[var(--text-primary)] tabular-nums tracking-tight truncate leading-none">{valueStr}</div>
                        <div className="text-[9.5px] font-black text-[var(--text-tertiary)] uppercase tracking-wider shrink-0">{unitStr}</div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ═══ ANALYTICS — Pixel-matched to reference image ═══════════
              • No shadows, barely-visible borders
              • gap-3 between all sections (tight like reference)
              • rounded-lg (8px, not 12px)
              • No visible dividers in analytics row
              • Section headers ultra-compact
              ═══════════════════════════════════════════════════════════ */}



          {/* ROW 2: Analytics triptych — ONE seamless surface */}
          <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all duration-300 hover:border-[var(--primary)]/15">
            <div className="grid grid-cols-1 lg:grid-cols-3">
              <div className="px-5 py-4">
                <BudgetAllocationChart data={activeAnalytics.boq} />
              </div>
              <div className="px-5 py-4 border-t lg:border-t-0 lg:border-l border-[var(--divider)]">
                <CashflowTrendChart data={activeAnalytics.cashflow} />
              </div>
              <div className="px-5 py-4 border-t lg:border-t-0 lg:border-l border-[var(--divider)]">
                <ProjectProgressChart data={activeAnalytics.kpis} timeline={activeAnalytics.forecast} />
              </div>
            </div>
          </div>

          {/* ROW 2: WBS + Cost Log (side-by-side, tight gap) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
            <section className="xl:col-span-7 rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all duration-300 hover:border-[var(--primary)]/15">
              <div className="px-4 py-2 border-b border-[var(--divider)]">
                <h3 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">WBS – Hạng mục và dự toán</h3>
              </div>
              <div className="px-3 py-2 overflow-x-auto">
                <WBSTable data={data.wbsRows} />
              </div>
            </section>

            <section className="xl:col-span-5 rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden transition-all duration-300 hover:border-[var(--primary)]/15">
              <div className="px-4 py-2 border-b border-[var(--divider)] flex items-center justify-between">
                <h3 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">Chi phí gần nhất</h3>
                <span 
                  onClick={() => router.push('/costs')}
                  className="text-[9px] font-semibold text-[var(--text-accent)] cursor-pointer hover:underline transition-all"
                >
                  Xem tất cả
                </span>
              </div>
              <div className="px-3 py-2 overflow-x-auto">
                <CostTable costs={data.costs} onEdit={setEditingCost} />
              </div>
            </section>
          </div>

          {/* ROW 3: Debt + P&L (aligned to same column split as Row 2) */}
          <div className="grid grid-cols-1 xl:grid-cols-12 gap-3">
            <div className="xl:col-span-5 rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all duration-300 hover:border-[var(--primary)]/15 animate-fade-in">
              <DebtPaymentChart kpis={activeAnalytics.kpis} />
            </div>
            <div className="xl:col-span-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all duration-300 hover:border-[var(--primary)]/15 animate-fade-in">
              <ProfitabilityChart kpis={activeAnalytics.kpis} />
            </div>
            <div className="xl:col-span-4 rounded-lg border border-[var(--border)] bg-[var(--card)] px-5 py-4 transition-all duration-300 hover:border-[var(--primary)]/15 animate-fade-in">
              <ExecutiveRiskCenter risks={analyticsData?.risk?.risks} />
            </div>
          </div>

        </div>
      </main>

      {/* Strategic AI Chat Assistant Panel */}
      <AIChatBox />

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
