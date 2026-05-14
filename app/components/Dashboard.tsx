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
import { formatVnd } from './dashboard-data';
import { useProjectsQuery, useProjectStatsQuery } from '@/services/queries/useProjects';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useWBSQuery } from '@/services/queries/useWBS';

export default function Dashboard() {
  const { currentProjectId, sidebarCollapsed, setCurrentProject } = useERPStore();
  const router = useRouter();

  // Queries
  const { data: paginatedData, isLoading: isLoadingProjects, isError: isErrorProjects, refetch: refetchProjects } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const { data: stats, isLoading: isLoadingStats, isError: isErrorStats, refetch: refetchStats } = useProjectStatsQuery(currentProjectId);
  const { data: costs = [], isLoading: isLoadingCosts, isError: isErrorCosts, refetch: refetchCosts } = useCostsQuery(currentProjectId);
  const { data: wbsData, isLoading: isLoadingWBS, isError: isErrorWBS, refetch: refetchWBS } = useWBSQuery(currentProjectId);

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
      wbsRows: wbsTree as any,
      progress: 0,
      daysElapsed: 0,
      durationDays: 0,
    };

    if (!stats) return fallbackData;

    const costByTypeArr = Object.entries(stats.costByType || {}).map(([type, value]) => ({
      type: type as CostType,
      label: type.charAt(0).toUpperCase() + type.slice(1),
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
      costByType: costByTypeArr,
      progress: stats.taskProgress,
    } as any;
  }, [currentProjectId, projects, stats, costs, wbsData]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#020617] flex">
        <Sidebar activeItem="overview" />
        <div className="flex-1">
          <div className="h-[74px] border-b border-slate-800/50 bg-[#0f172a] animate-pulse" />
          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map(i => <div key={i} className="h-32 rounded-2xl bg-slate-900 animate-pulse" />)}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 h-96 rounded-2xl bg-slate-900 animate-pulse" />
              <div className="h-96 rounded-2xl bg-slate-900 animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#020617] flex">
        <Sidebar activeItem="overview" />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="mb-6 mx-auto h-20 w-20 rounded-2xl bg-rose-500/10 border border-rose-500/20 grid place-items-center">
              <svg viewBox="0 0 24 24" className="h-10 w-10 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Lỗi kết nối dữ liệu</h2>
            <p className="text-sm text-slate-400 mb-8">Không thể kết nối tới máy chủ API. Vui lòng kiểm tra lại đường truyền mạng hoặc liên hệ quản trị viên.</p>
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
              <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Chưa có dự án nào</h2>
              <p className="text-sm font-bold text-[var(--text-muted)] uppercase tracking-widest mb-8 leading-relaxed">Hãy khởi tạo dự án đầu tiên để bắt đầu quản lý chi phí & tiến độ.</p>
              <button 
                onClick={() => router.push('/projects')}
                className="erp-btn bg-blue-600 text-white px-8 py-3 hover:bg-blue-500 shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)]"
              >
                Khởi tạo Dự án mới
              </button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const kpis = [
    { label: 'Doanh thu (Hợp đồng)', value: data.revenue, color: 'text-blue-400', icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Tổng chi phí thực tế', value: data.payable.total, color: 'text-rose-400', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.67 1M12 17c-1.12 0-2.1-.425-2.69-1.041' },
    { label: 'Phải thu khách hàng', value: data.receivable.total, color: 'text-emerald-400', icon: 'M17 9V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2m2 4h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z' },
    { label: 'Phải trả nhà thầu/NCC', value: data.payable.remaining, color: 'text-amber-400', icon: 'M3 10h18M7 15h1m4 0h1m4 0h1' },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex overflow-hidden">
      <Sidebar activeItem="overview" />
      
      <main className={`flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}>
        <Header data={data} />
        
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-8 space-y-8 animate-fade-in scrollbar-hide">
          {/* KPI Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {kpis.map((kpi, i) => (
              <div key={i} className="erp-kpi-card group cursor-default inner-border glow-primary bg-[var(--card)]">
                <div className="relative z-10 flex flex-col h-full">
                  <div className="flex items-center justify-between mb-4">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--secondary)] ring-1 ring-[var(--border)] ${kpi.color} group-hover:scale-110 group-hover:brightness-110 transition-all duration-300`}>
                      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2"><path d={kpi.icon} /></svg>
                    </div>
                    <div className="text-[10px] font-bold text-[var(--text-muted)]">Thời gian thực</div>
                  </div>
                  <div className="mt-auto">
                    <div className="text-[11px] font-black uppercase tracking-[0.2em] text-[var(--text-secondary)] mb-1">{kpi.label}</div>
                    <div className="flex items-baseline gap-2">
                      <div className="text-2xl font-black text-[var(--text-primary)] tabular-nums tracking-tight animate-count-up truncate min-w-0">{formatVnd(kpi.value)}</div>
                      <div className="text-[10px] font-bold text-[var(--text-muted)] shrink-0">VNĐ</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Financial Progress */}
              <section className="card-elevation p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
                    <h3 className="text-[13px] font-black text-[var(--text-primary)] tracking-tight uppercase">Tiến độ dòng tiền & Hạng mục</h3>
                    <p className="text-[9.5px] font-bold text-[var(--text-secondary)] tracking-wider mt-0.5">Tổng hợp WBS thời gian thực</p>
                  </div>
                </div>
                <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <WBSTable data={data.wbsRows} />
                </div>
              </section>

              {/* Recent Costs */}
              <section className="card-elevation p-6 md:p-8">
                <div className="mb-6 flex items-center justify-between">
                  <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
                    <h3 className="text-[13px] font-black text-[var(--text-primary)] tracking-tight uppercase">Chi phí ghi nhận gần nhất</h3>
                    <p className="text-[9.5px] font-bold text-[var(--text-secondary)] tracking-wider mt-0.5">Hóa đơn chi phí mới nhất</p>
                  </div>
                  <button
                    onClick={() => router.push('/costs')}
                    className="group flex items-center gap-2 rounded-lg px-3 py-1.5 text-[11px] font-black text-blue-600 hover:bg-blue-600/10 transition-all uppercase tracking-widest"
                  >
                    Xem tất cả
                    <svg viewBox="0 0 24 24" className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                  </button>
                </div>
                <div className="overflow-hidden rounded-xl border border-[var(--border)]">
                  <CostTable costs={data.costs.slice(0, 5)} onEdit={setEditingCost} />
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Debt Panels */}
              <DebtPanel receivable={data.receivable} payable={data.payable} />
              
              {/* Profit Section */}
              <ProfitPanel 
                revenue={data.revenue} 
                cost={data.payable.total} 
                margin={data.progress} 
              />
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
