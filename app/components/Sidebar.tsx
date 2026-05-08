'use client';

import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
  {
    id: 'overview',
    label: 'Tổng quan',
    href: '/',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
    ),
  },
  {
    id: 'projects',
    label: 'Dự án',
    href: '/projects',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  },
  {
    id: 'wbs',
    label: 'Hạng mục (WBS)',
    href: '/wbs',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />,
  },
  {
    id: 'budget',
    label: 'Dự toán',
    href: '/budget',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    ),
  },
  {
    id: 'costs',
    label: 'Chi phí',
    href: '/costs',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
  },
  {
    id: 'revenue',
    label: 'Doanh thu',
    href: '/revenue',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    ),
  },
  {
    id: 'debt',
    label: 'Công nợ',
    href: '/debt',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
    ),
  },
  {
    id: 'reports',
    label: 'Báo cáo',
    href: '/reports',
    icon: <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002 2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
  },
];

const bottomItems = [
  {
    id: 'system',
    label: 'Hệ thống',
    href: '/system',
    icon: (
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
    ),
  },
];

export default function Sidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`erp-sidebar ${collapsed ? 'collapsed' : ''}`}
    >
      {/* Logo Section */}
      <div className="flex h-[64px] items-center px-6 border-b border-[var(--border)]">
        <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[6px] bg-[var(--brand)] text-white">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        {!collapsed && (
          <div className="ml-3 overflow-hidden">
            <div className="truncate text-[15px] font-bold text-[var(--text-primary)]">Construction ERP</div>
            <div className="text-[10px] font-semibold text-[var(--text-secondary)] uppercase tracking-wider">Quản lý xây dựng</div>
          </div>
        )}
      </div>

      {/* Nav Section */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-1">
        {menuItems.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`flex w-full items-center rounded-[6px] px-3 py-2 transition-all group ${
                active 
                  ? 'bg-[var(--brand)] text-white font-semibold' 
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <div className={`flex-shrink-0 ${active ? 'text-white' : 'text-[var(--text-muted)] group-hover:text-[var(--text-secondary)]'}`}>
                <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2">
                  {item.icon}
                </svg>
              </div>
              {!collapsed && (
                <span className="ml-3 truncate text-[14px]">{item.label}</span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-[var(--border)] p-2">
        {bottomItems.map((item) => (
          <button
            key={item.id}
            onClick={() => router.push(item.href)}
            className="flex w-full items-center rounded-[6px] px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-all"
          >
            <div className="flex-shrink-0 text-[var(--text-muted)]">
              <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2">
                {item.icon}
              </svg>
            </div>
            {!collapsed && <span className="ml-3 truncate text-[14px]">{item.label}</span>}
          </button>
        ))}

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="mt-1 flex w-full items-center rounded-[6px] px-3 py-2 text-[var(--text-secondary)] hover:bg-[var(--bg-muted)] transition-all"
        >
          <div className={`flex-shrink-0 transition-transform ${collapsed ? 'rotate-180' : ''}`}>
            <svg viewBox="0 0 24 24" className="h-[20px] w-[20px]" fill="none" stroke="currentColor" strokeWidth="2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </div>
          {!collapsed && <span className="ml-3 truncate text-[14px] font-medium">Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}
