'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';

const menuItems = [
  { id: 'accounting', label: 'Kế toán công trình', href: '/accounting', icon: 'M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM10 9h4M10 13h4M10 17h2' },
  { id: 'overview', label: 'Tổng quan', href: '/', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { id: 'projects', label: 'Dự án', href: '/projects', icon: 'M4 7h16M7 7V5h10v2M6 10h12v10H6z' },
  { id: 'wbs', label: 'Hạng mục (WBS)', href: '/wbs', icon: 'M12 3v5m-6 4h12M6 12v5m12-5v5M4 17h4v4H4zm8 0h4v4h-4zm8 0h-4v4h4z' },
  { id: 'budget', label: 'Dự toán', href: '/budget', icon: 'M7 3h10v18H7zM10 7h4M10 11h4M10 15h2' },
  { id: 'costs', label: 'Chi phí', href: '/costs', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
  { id: 'revenue', label: 'Doanh thu', href: '/revenue', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.407 2.63 1m-2.63-1c-.74 0-1.4.194-1.92.512' },
  { id: 'debt', label: 'Công nợ', href: '/debt', icon: 'M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM10 9h4M10 13h4' },
  { id: 'reports', label: 'Báo cáo', href: '/reports', icon: 'M5 19V5m0 14h14M9 16V9m4 7V7m4 9v-5' },
  { id: 'system', label: 'Hệ thống', href: '/system', icon: 'M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83' },
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

  const isActive = (item: typeof menuItems[0]) => {
    if (activeItem) return activeItem === item.id;
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  };

  const filteredItems = menuItems.filter(item => {
    // Temporarily hidden from the primary accounting workflow: the dashboard still exists in code,
    // but generic widgets/AI insights are not the source of truth for construction accounting.
    if (item.id === 'overview') return false;
    if (item.id === 'system') return userRole === 'SUPER_ADMIN';
    if (item.id === 'budget' || item.id === 'costs') return ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(userRole);
    if (item.id === 'wbs' || item.id === 'revenue') return ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(userRole);
    return true;
  });

  const toggleTheme = () => {
    const isLight = document.documentElement.classList.toggle('light');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');
  };

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.remove('light');
    }
  }, []);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-[60] bg-black/80 backdrop-blur-md md:hidden animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      <aside className={`erp-sidebar fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-[var(--sidebar-border)] shadow-[var(--erp-card-shadow)] transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] md:translate-x-0 ${sidebarCollapsed ? 'w-[var(--erp-sidebar-collapsed)]' : 'w-[var(--erp-sidebar-width)]'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>

        {/* Logo Section */}
        <div className="flex h-[var(--erp-header-height)] items-center gap-4 px-6 overflow-hidden border-b border-[var(--sidebar-border)] bg-black/10">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white shadow-[0_0_20px_-5px_rgba(59,130,246,0.6)] group-hover:scale-105 transition-transform duration-300">
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 21V8l5-3 5 3v13M14 21V11l6 3v7M7 11h2M7 15h2" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in whitespace-nowrap min-w-0">
              <div className="text-[14px] font-black text-[var(--foreground)] tracking-tight leading-none uppercase">XÂY DỰNG</div>
              <div className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500 mt-1.5 opacity-90">ERP DOANH NGHIỆP</div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3.5 py-8 scrollbar-hide">
          <div className="space-y-1.5">
            {!sidebarCollapsed && (
              <div className="px-4 mb-4 text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.25em] opacity-60">
                ĐIỀU HÀNH
              </div>
            )}

            {filteredItems.map((item) => {
              const active = isActive(item);
              return (
                <button
                  key={item.id}
                  onClick={() => { router.push(item.href); setMobileMenuOpen(false); }}
                  title={sidebarCollapsed ? item.label : ''}
                  className={`relative flex h-12 w-full items-center gap-4 rounded-xl px-4 text-left transition-all duration-300 group overflow-hidden ${active
                    ? 'bg-blue-600/10 text-blue-500 shadow-[inset_0_0_12px_rgba(59,130,246,0.05)] border border-blue-500/10'
                    : 'text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] border border-transparent'
                    }`}
                >
                  {/* Active indicator */}
                  {active && (
                    <div className="absolute left-0 top-1/4 bottom-1/4 w-[4px] rounded-r-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.8)]" />
                  )}

                  {/* Icon */}
                  <div className={`shrink-0 transition-all duration-300 group-hover:scale-110 ${active ? 'text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]' : 'text-[var(--text-tertiary)] group-hover:text-blue-500'
                    }`}>
                    <NavIcon path={item.icon} />
                  </div>

                  {/* Label */}
                  {!sidebarCollapsed && (
                    <span className={`truncate text-[13px] font-bold tracking-tight transition-colors duration-300 ${active ? 'text-blue-500' : 'text-[var(--text-secondary)] group-hover:text-[var(--foreground)]'
                      }`}>
                      {item.label}
                    </span>
                  )}

                  {/* Hover State Glow */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none bg-gradient-to-r from-blue-500/[0.03] to-transparent" />
                </button>
              );
            })}
          </div>
        </nav>

        {/* Footer Area */}
        <div className="p-4 space-y-1.5 border-t border-[var(--sidebar-border)] bg-black/20">
          <button
            onClick={toggleTheme}
            className="flex h-11 w-full items-center gap-4 rounded-xl px-4 text-[13px] font-bold text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-all group border border-transparent hover:border-[var(--border)]"
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
            className="hidden md:flex h-11 w-full items-center gap-4 rounded-xl px-4 text-[13px] font-bold text-[var(--text-secondary)] hover:bg-[var(--secondary)] hover:text-[var(--foreground)] transition-all group border border-transparent hover:border-[var(--border)]"
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
