'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';

const menuGroups = [
  {
    title: 'TỔNG QUAN',
    items: [
      { id: 'dashboard', label: 'Bàn làm việc', href: '/', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
      { id: 'approvals', label: 'Duyệt chứng từ', href: '/approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
  {
    title: 'KẾ TOÁN',
    items: [
      { id: 'vouchers', label: 'Chứng từ', href: '/accounting', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
      { id: 'cash-bank', label: 'Quỹ & Ngân hàng', href: '/cash-bank', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
      { id: 'tax-invoice', label: 'Thuế VAT', href: '/tax', icon: 'M9 14l6-6m-5.5.5h.01m5.99 5h.01M3 21h18a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v14a2 2 0 002 2z' },
      { id: 'general-journal', label: 'Nhật ký chung', href: '/reports?tab=general-journal', icon: 'M8 7v12m0 0l-3-3m3 3l3-3M16 17V5m0 0l-3 3m3-3l3 3' },
      { id: 'ledger', label: 'Sổ cái', href: '/reports?tab=ledger', icon: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253' },
      { id: 'trial-balance', label: 'Cân đối phát sinh', href: '/reports?tab=trial-balance', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
    ],
  },
  {
    title: 'CÔNG NỢ',
    items: [
      { id: 'debt-receivable', label: 'Phải thu', href: '/debt?type=RECEIVABLE', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'debt-payable', label: 'Phải trả', href: '/debt?type=PAYABLE', icon: 'M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z' },
    ],
  },
  {
    title: 'CÔNG TRÌNH',
    items: [
      { id: 'projects', label: 'Hợp đồng', href: '/projects', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { id: 'costs', label: 'Chi phí', href: '/costs', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
      { id: 'revenue', label: 'Doanh thu', href: '/revenue', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
      { id: 'pnl', label: 'Lãi lỗ', href: '/reports?tab=financial', icon: 'M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z' },
    ],
  },
  {
    title: 'BÁO CÁO',
    items: [
      { id: 'reports', label: 'Báo cáo tổng hợp', href: '/reports', icon: 'M9 17v-2m3 2v-4m3 2v-6m-9 9h12a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z' },
    ],
  },
  {
    title: 'THIẾT LẬP',
    items: [
      { id: 'settings', label: 'Thiết lập', href: '/settings', icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
    ],
  },
];

function NavIcon({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function Sidebar({ activeItem }: { activeItem?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar, mobileMenuOpen, setMobileMenuOpen, userRole } = useERPStore();

  const isActive = (href: string, id: string) => {
    if (activeItem) return activeItem === id || (activeItem === 'debt' && id.startsWith('debt-'));
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href.split('?')[0]);
  };

  const toggleTheme = () => {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') document.documentElement.classList.add('light');
    else document.documentElement.classList.remove('light');
  }, []);

  return (
    <>
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`erp-sidebar fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-[var(--sidebar-border)] shadow-[var(--erp-card-shadow)] transition-all duration-300 ease-[var(--motion-easing-standard)] md:translate-x-0 ${sidebarCollapsed ? 'w-[var(--erp-sidebar-collapsed)]' : 'w-[var(--erp-sidebar-width)]'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[var(--erp-header-height)] items-center gap-4 px-6 overflow-hidden border-b border-[var(--sidebar-border)] bg-black/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.6)] transition-transform duration-300">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 21V8l5-3 5 3v13M14 21V11l6 3v7M7 11h2M7 15h2" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in whitespace-nowrap min-w-0">
              <div className="text-[14px] font-black text-[var(--foreground)] leading-none uppercase">XÂY DỰNG</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-blue-500 mt-1.5 opacity-90">ERP DOANH NGHIỆP</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6 scrollbar-hide space-y-6">
          {menuGroups.map((group, groupIdx) => {
            const allowedItems = group.items.filter(item => {
              if (item.id === 'settings') return userRole === 'SUPER_ADMIN';
              if (['costs', 'revenue', 'projects', 'budget'].includes(item.id)) {
                return ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(userRole);
              }
              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1.5">
                {!sidebarCollapsed && (
                  <div className="px-4 mb-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.2em] opacity-70">
                    {group.title}
                  </div>
                )}

                {allowedItems.map((item) => {
                  const active = isActive(item.href, item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                      title={sidebarCollapsed ? item.label : ''}
                      className={`relative flex h-10 w-full items-center gap-3.5 rounded-lg px-4 text-left transition-all duration-[var(--motion-duration-fast)] group overflow-hidden ${active ? 'bg-blue-600/10 text-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)] border border-blue-500/10' : 'text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] border border-transparent'}`}
                    >
                      {active && <div className="absolute left-0 top-1/4 bottom-1/4 w-[3px] rounded-r-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />}
                      <div className={`shrink-0 transition-all duration-[var(--motion-duration-fast)] group-hover:scale-105 ${active ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'text-[var(--text-tertiary)] group-hover:text-blue-500'}`}>
                        <NavIcon path={item.icon} />
                      </div>
                      {!sidebarCollapsed && (
                        <span className={`truncate text-[12px] font-semibold transition-colors duration-[var(--motion-duration-fast)] ${active ? 'text-blue-500' : 'text-[var(--text-secondary)] group-hover:text-[var(--foreground)]'}`}>
                          {item.label}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className="p-4 space-y-1.5 border-t border-[var(--sidebar-border)] bg-black/20">
          <button
            onClick={toggleTheme}
            className="flex h-11 w-full items-center gap-4 rounded-lg px-4 text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-all group border border-transparent hover:border-[var(--border)]"
          >
            <div className="shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--foreground)] group-hover:rotate-[30deg] transition-all duration-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
              </svg>
            </div>
            {!sidebarCollapsed && <span className="opacity-90">Chế độ hiển thị</span>}
          </button>

          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-11 w-full items-center gap-4 rounded-lg px-4 text-[12px] font-bold text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-all group border border-transparent hover:border-[var(--border)]"
          >
            <div className={`shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--foreground)] transition-all duration-500 ${sidebarCollapsed ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </div>
            {!sidebarCollapsed && <span className="opacity-90">Thu gọn menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
