'use client';

import { useState } from 'react';
import { useERPStore } from '@/store/erpStore';
import { DashboardData, formatVnd } from './dashboard-data';
import { ProjectStatus } from '@prisma/client';
import AddCostModal from '@/app/components/modals/AddCostModal';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import AddInvoiceModal from '@/app/components/modals/AddInvoiceModal';
import AddTaskModal from '@/app/components/modals/AddTaskModal';

const STATUS_CONFIG: Record<ProjectStatus, { label: string; badge: string }> = {
  [ProjectStatus.PLANNED]:     { label: 'Kế hoạch',   badge: 'badge-info'    },
  [ProjectStatus.ACTIVE]:      { label: 'Đang thi công', badge: 'badge-success' },
  [ProjectStatus.IN_PROGRESS]: { label: 'Đang thi công', badge: 'badge-success' },
  [ProjectStatus.COMPLETED]:   { label: 'Hoàn thành', badge: 'badge-info'    },
  [ProjectStatus.CLOSED]:      { label: 'Đã quyết toán', badge: 'badge-muted'   },
  [ProjectStatus.CANCELLED]:   { label: 'Tạm dừng',  badge: 'badge-warning' },
};

export default function Header({
  data: propData,
  title,
}: {
  data?: DashboardData;
  title?: string;
}) {
  const [showCost,    setShowCost]    = useState(false);
  const [showBudget,  setShowBudget]  = useState(false);
  const [showRevenue, setShowRevenue] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [showTask,    setShowTask]    = useState(false);

  const projects          = useERPStore((s) => s.projects);
  const currentProjectId  = useERPStore((s) => s.currentProjectId);
  const setCurrentProject = useERPStore((s) => s.setCurrentProject);
  const userRole          = useERPStore((s) => s.userRole);
  const getDashboardData  = useERPStore((s) => s.getDashboardData);

  const data = propData ?? getDashboardData();
  const statusCfg = STATUS_CONFIG[data?.project?.status as ProjectStatus] ?? { label: '—', badge: 'badge-muted' };

  return (
    <>
      <AddCostModal    isOpen={showCost}    onClose={() => setShowCost(false)}    />
      <AddBudgetModal  isOpen={showBudget}  onClose={() => setShowBudget(false)}  />
      <AddRevenueModal isOpen={showRevenue} onClose={() => setShowRevenue(false)} />
      <AddInvoiceModal isOpen={showInvoice} onClose={() => setShowInvoice(false)} />
      <AddTaskModal    isOpen={showTask}    onClose={() => setShowTask(false)}     />

      <header className="erp-topbar">
        {/* Left Section: Breadcrumb & Title */}
        <div className="flex items-center min-w-0">
          <h1 className="t-page-title whitespace-nowrap mr-6">{title ?? 'Tổng quan dự án'}</h1>
          
          {/* Project Selector - ERP Standard */}
          {projects.length > 0 && (
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <select
                  value={currentProjectId}
                  onChange={(e) => setCurrentProject(e.target.value)}
                  className="h-10 max-w-[320px] appearance-none rounded-[6px] border border-[var(--border)] bg-white px-3 pr-10 text-[14px] font-semibold text-[var(--text-primary)] outline-none transition-all hover:border-[var(--brand)] focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)] truncate cursor-pointer"
                >
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </div>
              </div>

              <span className={`badge ${statusCfg.badge} hidden lg:inline-flex`}>
                {statusCfg.label}
              </span>
            </div>
          )}
        </div>

        {/* Right Section: Actions, Filter & User */}
        <div className="flex items-center gap-[var(--sp-16)]">
          {/* Date Filter Placeholder */}
          <div className="hidden md:flex items-center h-10 px-3 rounded-[6px] border border-[var(--border)] bg-white text-[13px] font-medium text-[var(--text-secondary)] gap-2 cursor-pointer hover:bg-[var(--bg-subtle)]">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>20/06/2024</span>
          </div>

          <div className="h-6 w-px bg-[var(--border)]"></div>

          {/* User Info */}
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand)] text-white font-bold text-[13px] shadow-sm">
              AD
            </div>
            <div className="flex flex-col items-start hidden sm:flex">
              <span className="text-[13px] font-bold text-[var(--text-primary)] leading-none mb-0.5">admin</span>
              <span className="text-[11px] font-medium text-[var(--text-secondary)] uppercase tracking-tight">Quản trị viên</span>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
