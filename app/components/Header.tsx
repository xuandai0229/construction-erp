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

export default function Header({ data: propData }: { data?: DashboardData }) {
  const [showCostModal, setShowCostModal]       = useState(false);
  const [showBudgetModal, setShowBudgetModal]   = useState(false);
  const [showRevenueModal, setShowRevenueModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showTaskModal, setShowTaskModal]       = useState(false);
  const [userMenuOpen, setUserMenuOpen]         = useState(false);
  const [notifOpen, setNotifOpen]               = useState(false);

  const {
    currentProjectId, setCurrentProject,
    userRole, user, logout, setMobileMenuOpen,
  } = useERPStore();

  const { data: projects = [] } = useProjectsQuery();
  const currentProject = projects.find((p: any) => p.id === currentProjectId);

  const stats = [
    { label: 'Chủ đầu tư',      value: currentProject?.investor || '—',              icon: 'M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2' },
    { label: 'Giá trị HĐ',      value: formatVnd(currentProject?.contractValue || 0), icon: 'M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
    { label: 'Loại công trình',  value: currentProject?.projectType || 'Dân dụng',    icon: 'M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z' },
  ];

  return (
    <>
      <AddCostModal    isOpen={showCostModal}    onClose={() => setShowCostModal(false)} />
      <AddBudgetModal  isOpen={showBudgetModal}  onClose={() => setShowBudgetModal(false)} />
      <AddRevenueModal isOpen={showRevenueModal} onClose={() => setShowRevenueModal(false)} />
      <AddInvoiceModal isOpen={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} />
      <AddTaskModal    isOpen={showTaskModal}    onClose={() => setShowTaskModal(false)} />

      <header className="sticky top-0 z-50 border-b border-[var(--border)] bg-[var(--header-bg)] backdrop-blur-xl">
        <div className="flex h-[var(--erp-header-height)] items-center justify-between gap-4 px-4 md:px-6 overflow-hidden">

          {/* ── Left: Mobile Toggle + Project Selector ── */}
          <div className="flex shrink-0 items-center gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-800 text-slate-400 md:hidden hover:bg-slate-800 hover:text-white transition-all"
            >
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            {/* Project Selector */}
            <div className="flex min-w-0 flex-col">
              <div className="flex items-center gap-2">
                <select
                  value={currentProjectId}
                  onChange={(e) => setCurrentProject(e.target.value)}
                  className="max-w-[180px] truncate bg-transparent text-[15px] font-extrabold text-[var(--text-primary)] focus:outline-none cursor-pointer hover:text-blue-400 transition-colors md:max-w-[240px]"
                >
                  {projects.map(p => (
                    <option key={p.id} value={p.id} className="bg-slate-900 text-slate-100 font-bold">
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.18em] truncate max-w-[80px] sm:max-w-none">
                  ID: {currentProjectId ? currentProjectId.slice(0, 8).toUpperCase() : '--------'}
                </div>
                <span className="shrink-0 rounded-full bg-blue-500/10 px-2 py-0.5 text-[9px] font-black text-blue-500 ring-1 ring-blue-500/30 tracking-tight flex items-center">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* ── Center: Project Stats (xl only) ── */}
          <div className="hidden xl:flex flex-1 items-center justify-center gap-8">
            {stats.map((s, i) => (
              <div key={i} className="flex items-center gap-3 group">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-slate-800/60 bg-slate-800/30 text-slate-500 group-hover:border-blue-500/25 group-hover:bg-blue-600/10 group-hover:text-blue-400 transition-all duration-200">
                  <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d={s.icon} />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[9.5px] font-black uppercase tracking-[0.18em] text-slate-500 leading-none mb-0.5">
                    {s.label}
                  </span>
                  <span className="text-[12px] font-extrabold text-slate-200 truncate max-w-[140px] group-hover:text-white transition-colors">
                    {s.value}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* ── Right: Actions + Notifications + User ── */}
          <div className="flex shrink-0 items-center gap-2 md:gap-3">

            {/* Quick-add buttons (lg+) */}
            <div className="hidden lg:flex items-center gap-2">
              <button
                onClick={() => setShowCostModal(true)}
                className="erp-btn h-9 border border-amber-600/20 bg-amber-600/10 text-amber-400 hover:bg-amber-600 hover:text-white hover:border-amber-600 hover:shadow-[0_0_16px_-4px_rgba(217,119,6,0.5)] transition-all"
                title="Thêm chi phí"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                <span>Chi phí</span>
              </button>
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotifOpen(!notifOpen)}
                className={`relative flex h-9 w-9 items-center justify-center rounded-xl border transition-all ${
                  notifOpen
                    ? 'bg-slate-800 border-slate-700 text-white'
                    : 'border-slate-800/60 text-slate-400 hover:bg-slate-800/50 hover:border-slate-700 hover:text-white'
                }`}
              >
                <svg viewBox="0 0 24 24" className="h-4.5 w-4.5" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" />
                </svg>
                <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-blue-500 ring-2 ring-[#020617] shadow-[0_0_6px_rgba(59,130,246,0.8)]" />
              </button>

              {notifOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-[var(--border)] bg-[var(--popover)] p-4 shadow-2xl backdrop-blur-xl animate-scale-up z-[60]" style={{boxShadow: '0 20px 60px -10px rgba(0,0,0,0.4)'}}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Thông báo</h4>
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                  </div>
                  <div className="space-y-3">
                    <div className="cursor-pointer group">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-blue-500 shrink-0" />
                        <span className="text-[11px] font-bold text-white">Hệ thống cập nhật</span>
                      </div>
                      <p className="pl-3.5 text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                        &quot;{currentProject?.name}&quot; vừa có cập nhật chi phí mới.
                      </p>
                      <span className="pl-3.5 text-[9px] font-bold text-slate-600 mt-0.5 block">2 PHÚT TRƯỚC</span>
                    </div>
                    <div className="h-px bg-slate-800/50" />
                    <div className="cursor-pointer group">
                      <div className="flex items-center gap-2 mb-0.5">
                        <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shrink-0" />
                        <span className="text-[11px] font-bold text-white">Công nợ quá hạn</span>
                      </div>
                      <p className="pl-3.5 text-[11px] text-slate-400 leading-relaxed group-hover:text-slate-300 transition-colors">
                        Hóa đơn #INV-2024-001 quá hạn 3 ngày.
                      </p>
                      <span className="pl-3.5 text-[9px] font-bold text-slate-600 mt-0.5 block">1 GIỜ TRƯỚC</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="h-7 w-px bg-slate-800/60" />

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={`flex items-center gap-2.5 rounded-xl border px-2 py-1 transition-all ${
                  userMenuOpen
                    ? 'bg-slate-800 border-slate-700'
                    : 'border-slate-800/60 bg-slate-800/20 hover:bg-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Avatar */}
                <div className="h-7 w-7 shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-600 to-indigo-700 grid place-items-center font-black text-[12px] text-white shadow-md shadow-blue-600/20">
                  {user?.name ? user.name.substring(0, 2).toUpperCase() : 'AD'}
                </div>

                {/* Name + Role */}
                <div className="hidden flex-col items-start md:flex">
                  <span className="text-[12.5px] font-bold text-slate-100 leading-none">
                    {user?.name || 'Administrator'}
                  </span>
                  <span className="text-[9px] font-black text-blue-500 uppercase tracking-widest mt-0.5">
                    {user?.role || userRole}
                  </span>
                </div>

                <svg
                  viewBox="0 0 24 24"
                  className={`h-3.5 w-3.5 text-slate-500 transition-transform duration-300 ${userMenuOpen ? 'rotate-180' : ''}`}
                  fill="none" stroke="currentColor" strokeWidth="2"
                >
                  <path d="m6 9 6 6 6-6" />
                </svg>
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-2xl border border-[var(--border)] bg-[var(--popover)] py-2 shadow-2xl backdrop-blur-xl animate-scale-up z-[60]" style={{boxShadow: '0 20px 60px -10px rgba(0,0,0,0.4)'}}>
                  <div className="px-4 py-2.5 border-b border-[var(--divider)] mb-1">
                    <div className="text-[9.5px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-0.5">Đăng nhập bởi</div>
                    <div className="text-[11.5px] font-bold text-[var(--text-accent)] truncate">{user?.email || 'admin@erp.com'}</div>
                  </div>

                  <button className="flex w-full items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors">
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 7a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
                    </svg>
                    Thông tin cá nhân
                  </button>

                  <button
                    onClick={() => window.location.href = '/settings'}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)] transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 text-[var(--text-muted)] shrink-0" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    Cài đặt hệ thống
                  </button>

                  <div className="my-1.5 h-px bg-[var(--divider)] mx-3" />

                  <button
                    onClick={logout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-[12px] font-black text-rose-500 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                  >
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                    </svg>
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
