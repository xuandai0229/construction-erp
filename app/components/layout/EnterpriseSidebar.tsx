'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { useERPStore } from '@/store/erpStore';

const menuGroups = [
  {
    title: 'TỔNG QUAN',
    items: [
      { id: 'dashboard', label: 'Bàn làm việc', href: '/', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
    ],
  },
  {
    title: 'CÔNG TRÌNH',
    items: [
      { id: 'projects', label: 'Hồ sơ công trình', href: '/projects', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
      { id: 'wbs', label: 'Hạng mục thi công', href: '/wbs', icon: 'M4 6h16M4 12h16m-7 6h7' },
    ],
  },
  {
    title: 'HỢP ĐỒNG & DỰ TOÁN',
    items: [
      { id: 'revenue', label: 'Hợp đồng / Doanh thu', href: '/revenue', icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6' },
      { id: 'budget', label: 'Dự toán (Budget)', href: '/budget', icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
    ],
  },
  {
    title: 'CHI PHÍ & CÔNG NỢ',
    items: [
      { id: 'costs', label: 'Chi phí thi công', href: '/costs', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
      { id: 'debt', label: 'Quản lý công nợ', href: '/debt', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
      { id: 'cash-bank', label: 'Quỹ & Ngân hàng', href: '/cash-bank', icon: 'M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z' },
    ],
  },
  {
    title: 'KHO & VẬT TƯ',
    items: [
      { id: 'inventory', label: 'Quản lý kho', href: '/inventory', icon: 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-18v18m-8-14v10l8 4' },
    ],
  },
  {
    title: 'THUẾ & HÓA ĐƠN',
    items: [
      { id: 'tax', label: 'Thuế VAT', href: '/tax', icon: 'M9 14l6-6m-5.5.5h.01m5.99 5h.01M3 21h18a2 2 0 002-2V5a2 2 0 00-2-2H3a2 2 0 00-2 2v14a2 2 0 002 2z' },
    ],
  },
  {
    title: 'BÁO CÁO',
    items: [
      { id: 'reports', label: 'Báo cáo tổng hợp', href: '/reports', icon: 'M9 17v-2m3 2v-4m3 2v-6m-9 9h12a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2z' },
    ],
  },
  {
    title: 'PHÊ DUYỆT',
    items: [
      { id: 'approvals', label: 'Duyệt chứng từ', href: '/approvals', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
    ],
  },
  {
    title: 'HỆ THỐNG',
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

export default function EnterpriseSidebar({ activeItem }: { activeItem?: string }) {
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

      <aside className={`erp-sidebar fixed inset-y-0 left-0 z-[70] flex flex-col border-r border-[var(--sidebar-border)] bg-[var(--background)] transition-all duration-300 ease-[var(--motion-easing-standard)] md:translate-x-0 ${sidebarCollapsed ? 'w-[var(--erp-sidebar-collapsed)]' : 'w-[var(--erp-sidebar-width)]'} ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-[var(--erp-header-height)] items-center gap-3 px-5 overflow-hidden border-b border-[var(--border)] shrink-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--primary)] text-white shadow-[0_0_15px_-5px_var(--primary)] transition-transform duration-300">
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M4 21V8l5-3 5 3v13M14 21V11l6 3v7M7 11h2M7 15h2" />
            </svg>
          </div>
          {!sidebarCollapsed && (
            <div className="animate-fade-in whitespace-nowrap min-w-0">
              <div className="text-[14px] font-black text-[var(--text-primary)] leading-none uppercase tracking-tight">XÂY DỰNG</div>
              <div className="text-[9px] font-bold uppercase tracking-[0.25em] text-[var(--primary)] mt-1 opacity-90">ERP DOANH NGHIỆP</div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-6 scrollbar-hide space-y-7 bg-[var(--sidebar-bg,var(--background))]">
          {menuGroups.map((group, groupIdx) => {
            const allowedItems = group.items.filter(item => {
              if (item.id === 'settings') return userRole === 'SUPER_ADMIN';
              if (['costs', 'revenue', 'projects', 'budget', 'inventory'].includes(item.id)) {
                return ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'MANAGER'].includes(userRole);
              }
              return true;
            });

            if (allowedItems.length === 0) return null;

            return (
              <div key={groupIdx} className="space-y-1">
                {!sidebarCollapsed && (
                  <div className="px-3 mb-2 text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-[0.15em] opacity-80">
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
                      className={`relative flex h-9 w-full items-center gap-3 rounded-md px-3 text-left transition-all duration-[var(--motion-duration-fast)] group overflow-hidden cursor-pointer ${active ? 'bg-[var(--primary)]/10 text-[var(--primary)] font-semibold' : 'text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)] font-medium'}`}
                    >
                      {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-full bg-[var(--primary)]" />}
                      <div className={`shrink-0 transition-all duration-[var(--motion-duration-fast)] group-hover:scale-105 ${active ? 'text-[var(--primary)]' : 'text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)]'}`}>
                        <NavIcon path={item.icon} />
                      </div>
                      {!sidebarCollapsed && (
                        <span className="truncate text-[12px]">
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

        <div className="p-3 space-y-1 border-t border-[var(--border)] shrink-0 bg-[var(--sidebar-bg,var(--background))]">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-full items-center gap-3 rounded-md px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)] transition-all group cursor-pointer"
          >
            <div className="shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] group-hover:rotate-[30deg] transition-all duration-500">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-11.314l.707.707m11.314 11.314l.707.707M12 5a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
              </svg>
            </div>
            {!sidebarCollapsed && <span>Chế độ hiển thị</span>}
          </button>

          <button
            onClick={toggleSidebar}
            className="hidden md:flex h-9 w-full items-center gap-3 rounded-md px-3 text-[12px] font-medium text-[var(--text-secondary)] hover:bg-[var(--muted)] hover:text-[var(--text-primary)] transition-all group cursor-pointer"
          >
            <div className={`shrink-0 text-[var(--text-tertiary)] group-hover:text-[var(--text-primary)] transition-all duration-500 ${sidebarCollapsed ? 'rotate-180' : ''}`}>
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="m15 18-6-6 6-6" />
              </svg>
            </div>
            {!sidebarCollapsed && <span>Thu gọn menu</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
