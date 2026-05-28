'use client';

import { useState } from 'react';
import { DashboardData, formatVnd } from './dashboard-data';
import AddCostModal from '@/app/components/modals/AddCostModal';
import AddBudgetModal from '@/app/components/modals/AddBudgetModal';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import AddInvoiceModal from '@/app/components/modals/AddInvoiceModal';
import AddTaskModal from '@/app/components/modals/AddTaskModal';

import { useERPStore } from '@/store/erpStore';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { useNotificationsQuery, useNotificationMutation } from '@/services/queries/useWorkspace';
import { USER_ROLE_LABELS, Project } from '@/app/types';
import NotificationCenter from './workspace/NotificationCenter';
import ProjectSwitcher from './workspace/ProjectSwitcher';

export default function Header({ data: propData }: { data?: DashboardData }) {
  const [showCostModal, setShowCostModal] = useState(false);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const {
    currentProjectId,
    userRole, user, logout, setMobileMenuOpen,
  } = useERPStore();

  const { data: paginatedData } = useProjectsQuery();
  const projects: Project[] = paginatedData?.data || [];
  const currentProject = projects.find((p) => p.id === currentProjectId);

  const { data: notifications = [] } = useNotificationsQuery();
  const { mutate: markNotif } = useNotificationMutation();
  const unreadCount = notifications.filter((n: { isRead: boolean }) => !n.isRead).length;

  const translateProjectType = (type?: string | null) => {
    if (!type) return 'Dân dụng';
    const upper = type.toUpperCase();
    if (upper === 'URBAN_DEVELOPMENT') return 'Phát triển Đô thị';
    if (upper === 'INFRASTRUCTURE') return 'Hạ tầng';
    if (upper === 'RESIDENTIAL') return 'Nhà ở dân dụng';
    if (upper === 'COMMERCIAL') return 'Thương mại';
    if (upper === 'INDUSTRIAL') return 'Công nghiệp';
    return type;
  };

  const stats = [
    { label: 'Chủ đầu tư / Đối tác', value: currentProject?.investor || '—', icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
    { label: 'Giá trị HĐ', value: formatVnd(propData?.revenue || currentProject?.contractValue || 0), icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Loại công trình', value: translateProjectType(currentProject?.projectType), icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  ];

  return (
    <>
      <AddCostModal isOpen={showCostModal} onClose={() => setShowCostModal(false)} />
      <AddBudgetModal isOpen={showBudgetModal} onClose={() => setShowBudgetModal(false)} />
      <AddRevenueModal isOpen={showRevenueModal} onClose={() => setShowRevenueModal(false)} />
      <AddInvoiceModal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} />
      <AddTaskModal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} />

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-md shadow-sm no-print">
        <div className="max-w-[1600px] mx-auto flex h-[var(--erp-header-height)] items-center justify-between gap-6 px-6 lg:px-8">

          {/* ── Left: Mobile Toggle + Project Switcher ── */}
          <div className="flex shrink-0 items-center gap-5 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] text-[var(--text-tertiary)] md:hidden hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-all shadow-sm"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Scalable Project Switcher */}
            <ProjectSwitcher />
          </div>

          {/* ── Center: Project Stats (xl only) ── */}
          <div className="hidden 2xl:flex flex-1 items-center justify-center gap-10">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-4 group">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[var(--border)] bg-[var(--secondary)]/30 text-[var(--text-tertiary)] group-hover:text-blue-500 group-hover:border-blue-500/30 group-hover:bg-blue-500/5 transition-all duration-500 shadow-sm">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2.2">
                    <path d={s.icon} />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-[var(--text-tertiary)] leading-none mb-2 opacity-60 flex items-center gap-2">
                    {s.label}
                    {i === 1 && propData?.version && (
                      <span className="bg-blue-500/10 text-blue-500 px-1.5 py-0.5 rounded text-[8px] border border-blue-500/20">
                        {propData.version}
                      </span>
                    )}
                  </span>
                  <span className="text-[12px] font-bold text-[var(--text-primary)] truncate max-w-[200px] group-hover:text-blue-500 transition-colors tracking-tight tabular-nums font-mono">
                    {s.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Right: Actions + Notifications + User ── */}
          <div className="flex shrink-0 items-center gap-5 md:gap-6">

            {/* Quick-add buttons (lg+) */}
            <div className="hidden lg:flex items-center gap-3">
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2.5 h-10 px-5 rounded-xl border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-primary)] hover:bg-[var(--divider)] transition-all text-[10px] font-black uppercase tracking-[0.15em] shadow-sm active:scale-95 no-print"
                title="Xuất PDF / In báo cáo"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M6 9V2h12v7M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2M6 14h12v8H6z" />
                </svg>
                <span>Báo cáo</span>
              </button>
              <button
                onClick={() => setShowCostModal(true)}
                className="flex items-center gap-2.5 h-10 px-5 rounded-xl border border-amber-500/20 bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 hover:border-amber-500/40 transition-all text-[10px] font-black uppercase tracking-[0.15em] shadow-[0_0_20px_-5px_rgba(245,158,11,0.2)] active:scale-95"
                title="Ghi nhận chi phí"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Chi phí</span>
              </button>
            </div>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-all duration-300 ${notifOpen
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_0_25px_-5px_rgba(37,99,235,0.6)]'
                  : 'border-[var(--border)] text-[var(--text-tertiary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-tertiary)]/30 shadow-sm'
                  }`}
              >
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                {unreadCount > 0 && (
                  <span className="absolute -right-1 -top-1 flex h-[18px] w-[18px] items-center justify-center rounded-full bg-rose-500 text-[10px] font-bold text-white ring-2 ring-[var(--header-bg)] animate-pulse shadow-sm">
                    {unreadCount}
                  </span>
                )}
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-4 z-[100] animate-in fade-in slide-in-from-top-2 duration-300">
                  <NotificationCenter
                    notifications={notifications}
                    onRead={(id) => markNotif({ action: 'READ', id })}
                    onReadAll={() => markNotif({ action: 'READ_ALL' })}
                  />
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-8 w-px bg-[var(--divider)]" />

            {/* User Menu */}
            <div className={`relative ${userMenuOpen ? 'z-[70]' : 'z-[10]'}`}>
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-3.5 rounded-xl border px-3 py-1.5 transition-all duration-300 ${userMenuOpen
                  ? 'bg-[var(--secondary)] border-blue-500/50 shadow-[inset_0_2px_10px_rgba(0,0,0,0.1)]'
                  : 'border-[var(--border)] hover:bg-[var(--secondary)] hover:border-[var(--text-tertiary)]/30 shadow-sm'
                  }`}
              >
                {/* Avatar */}
                <div className="h-9 w-9 shrink-0 overflow-hidden rounded-xl bg-blue-600 text-white grid place-items-center font-black text-[12px] shadow-md transition-transform group-hover:scale-105">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
                </div>

                {/* Name + Role */}
                <div className="hidden flex-col items-start md:flex min-w-[90px]">
                  <span className="text-[12px] font-bold text-[var(--text-primary)] leading-none mb-1.5 tracking-tight">
                    {user?.name || 'Quản trị viên'}
                  </span>
                  <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em] opacity-70">
                    {USER_ROLE_LABELS[user?.role as keyof typeof USER_ROLE_LABELS || userRole as keyof typeof USER_ROLE_LABELS] || userRole}
                  </span>
                </div>

                <svg
                  viewBox="0 0 24 24"
                  className={`h-4.5 w-4.5 text-[var(--text-tertiary)] transition-transform duration-500 ${userMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2.5"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-4 w-60 rounded-2xl border border-[var(--border)] bg-[var(--popover)] py-2.5 shadow-[var(--erp-hover-shadow)] animate-scale-up z-[60] overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-500/[0.03] to-transparent pointer-events-none" />

                  <div className="relative z-10 px-5 py-4 border-b border-[var(--divider)] mb-1.5 bg-black/[0.02]">
                    <div className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] mb-1.5 opacity-60">Xác thực bởi</div>
                    <div className="text-[13px] font-black text-blue-500 truncate tracking-tight">{user?.email || 'admin@erp.com'}</div>
                  </div>

                  <button className="relative z-10 flex w-full items-center gap-3.5 px-5 py-3 text-[13px] font-bold text-[var(--text-secondary)] hover:bg-blue-500/[0.04] hover:text-blue-500 transition-all group">
                    <div className="h-8 w-8 rounded-xl bg-[var(--secondary)] grid place-items-center group-hover:bg-blue-500/10 transition-colors border border-[var(--border)] shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[var(--text-tertiary)] group-hover:text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                      </svg>
                    </div>
                    Thông tin cá nhân
                  </button>

                  <button
                    onClick={() => window.location.href = '/settings'}
                    className="relative z-10 flex w-full items-center gap-3.5 px-5 py-3 text-[13px] font-bold text-[var(--text-secondary)] hover:bg-blue-500/[0.04] hover:text-blue-500 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-[var(--secondary)] grid place-items-center group-hover:bg-blue-500/10 transition-colors border border-[var(--border)] shadow-sm">
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 text-[var(--text-tertiary)] group-hover:text-blue-500 shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                      </svg>
                    </div>
                    Cài đặt hệ thống
                  </button>

                  <div className="relative z-10 my-2.5 h-px bg-[var(--divider)] mx-5" />

                  <button
                    onClick={logout}
                    className="relative z-10 flex w-full items-center gap-3.5 px-5 py-3 text-[13px] font-black text-rose-500 hover:bg-rose-500/10 transition-all group"
                  >
                    <div className="h-8 w-8 rounded-xl bg-rose-500/5 grid place-items-center group-hover:bg-rose-500/10 transition-colors border border-rose-500/10">
                      <svg viewBox="0 0 24 24" className="h-4.5 w-4.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                      </svg>
                    </div>
                    Đăng xuất
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
