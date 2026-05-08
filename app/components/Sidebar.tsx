'use client';

import { useRouter, usePathname } from 'next/navigation';

const NAV_GROUPS = [
  {
    group: 'TỔNG QUAN',
    items: [
      {
        id: 'overview',
        label: 'Bảng điều khiển',
        href: '/',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'DỰ ÁN',
    items: [
      {
        id: 'projects',
        label: 'Quản lý Dự án',
        href: '/projects',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        ),
      },
      {
        id: 'wbs',
        label: 'Hạng mục (WBS)',
        href: '/wbs',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 7h4m0 0V5m0 2v2M7 7h2a2 2 0 012 2v1m0 0h2m-2 0v2m2-2h2a2 2 0 012 2v1M3 15h4m4-6h2m0 0V7m0 2v2m0 2h2" />
            <path d="M4 12h16M4 17h16" strokeLinecap="round" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'TÀI CHÍNH',
    items: [
      {
        id: 'budget',
        label: 'Dự toán',
        href: '/budget',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        ),
      },
      {
        id: 'costs',
        label: 'Chi phí',
        href: '/costs',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        ),
      },
      {
        id: 'revenue',
        label: 'Doanh thu',
        href: '/revenue',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        ),
      },
      {
        id: 'debt',
        label: 'Công nợ (AR/AP)',
        href: '/debt',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        ),
      },
    ],
  },
  {
    group: 'PHÂN TÍCH',
    items: [
      {
        id: 'reports',
        label: 'Báo cáo',
        href: '/reports',
        icon: (
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        ),
      },
    ],
  },
];

const BOTTOM_ITEMS = [
  {
    id: 'system',
    label: 'Cài đặt hệ thống',
    href: '/system',
    icon: (
      <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
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
    <aside className={`erp-sidebar ${collapsed ? 'collapsed' : ''}`}>
      {/* Logo */}
      <div
        style={{
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid var(--border)',
          gap: '10px',
          flexShrink: 0,
        }}
      >
        <div
          style={{
            height: '34px',
            width: '34px',
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '8px',
            background: 'var(--brand)',
            color: 'white',
          }}
        >
          <svg viewBox="0 0 24 24" style={{ height: '18px', width: '18px' }} fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>
              Construction ERP
            </div>
            <div style={{ fontSize: '10px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Nền tảng Doanh nghiệp
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, overflowY: 'auto', padding: '8px 8px 0', display: 'flex', flexDirection: 'column', gap: '0' }}>
        {NAV_GROUPS.map((group) => (
          <div key={group.group} style={{ marginBottom: '4px' }}>
            {/* Group Label */}
            {!collapsed && (
              <div
                style={{
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#94a3b8',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  padding: '10px 10px 4px',
                }}
              >
                {group.group}
              </div>
            )}
            {collapsed && <div style={{ height: '8px' }} />}

            {/* Items */}
            {group.items.map((item) => {
              const active = isActive(item.href);
              const railColor = '#2563eb';
              return (
                <div
                  key={item.id}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0,
                    position: 'relative',
                  }}
                >
                  {/* Active rail */}
                  {!collapsed && (
                    <div
                      aria-hidden="true"
                      style={{
                        width: active ? 4 : 3,
                        height: 38,
                        borderRadius: 999,
                        marginLeft: 6,
                        background: active ? railColor : 'transparent',
                        boxShadow: active ? 'var(--shadow-rail)' : 'none',
                        transition: 'all 0.18s ease',
                      }}
                    />
                  )}

                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    title={collapsed ? item.label : undefined}
                    style={{
                      display: 'flex',
                      width: '100%',
                      alignItems: 'center',
                      gap: '10px',
                      padding: collapsed ? '9px' : '9px 10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: '10px',
                      marginBottom: '1px',
                      fontSize: '13.5px',
                      fontWeight: active ? 800 : 500,
                      cursor: 'pointer',
                      transition: 'background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease, border-color .18s ease',
                      border: `1px solid ${active ? 'rgba(37,99,235,0.35)' : 'transparent'}`,
                      textAlign: 'left',
                      background: active ? 'rgba(37, 99, 235, 0.10)' : 'transparent',
                      color: active ? '#0B1220' : '#64748b',
                      boxShadow: active ? '0 10px 28px rgba(37,99,235,0.10)' : 'none',
                      transform: active ? 'translateX(2px)' : 'translateX(0)',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                    onMouseEnter={(e) => {
                      if (!active) {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = 'rgba(100, 116, 139, 0.06)';
                        btn.style.color = '#0B1220';
                        btn.style.transform = collapsed ? 'translateY(-1px)' : 'translateX(2px)';
                        btn.style.borderColor = 'rgba(148,163,184,0.4)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) {
                        const btn = e.currentTarget as HTMLButtonElement;
                        btn.style.background = 'transparent';
                        btn.style.color = '#64748b';
                        btn.style.transform = 'translateX(0)';
                        btn.style.borderColor = 'transparent';
                      }
                    }}
                  >
                    <span
                      style={{
                        flexShrink: 0,
                        opacity: active ? 1 : 0.75,
                        color: active ? railColor : 'inherit',
                        transition: 'opacity 0.18s ease, color 0.18s ease',
                      }}
                    >
                      {item.icon}
                    </span>
                    {!collapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>
                    )}
                  </button>
                </div>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{ borderTop: '1px solid var(--border)', padding: '8px' }}>
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              title={collapsed ? item.label : undefined}
              style={{
                display: 'flex',
                width: '100%',
                alignItems: 'center',
                gap: '10px',
                padding: collapsed ? '9px' : '9px 10px',
                justifyContent: collapsed ? 'center' : 'flex-start',
                borderRadius: '12px',
                marginBottom: '2px',
                fontSize: '13.5px',
                fontWeight: active ? 600 : 400,
                cursor: 'pointer',
                transition: 'background .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease',
                border: 'none',
                background: active ? '#2563eb' : 'transparent',
                color: active ? '#fff' : '#64748b',
              }}
              onMouseEnter={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-primary)';
                }
              }}
              onMouseLeave={(e) => {
                if (!active) {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
                }
              }}
            >
              <span style={{ flexShrink: 0, opacity: 0.7 }}>{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          title={collapsed ? 'Mở rộng' : 'Thu gọn'}
          style={{
            display: 'flex',
            width: '100%',
            alignItems: 'center',
            gap: '10px',
            padding: collapsed ? '9px' : '9px 10px',
            justifyContent: collapsed ? 'center' : 'flex-start',
            borderRadius: '6px',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 0.12s ease',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            marginTop: '4px',
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'var(--bg-muted)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          <svg
            viewBox="0 0 24 24"
            style={{ height: '16px', width: '16px', flexShrink: 0, transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span style={{ fontSize: '13px', fontWeight: 500 }}>Thu gọn</span>}
        </button>
      </div>
    </aside>
  );
}
