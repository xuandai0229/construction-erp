'use client';

import { useRouter, usePathname } from 'next/navigation';

const mainMenuItems = [
  {
    group: 'OPERATIONS',
    items: [
      {
        id: 'overview',
        label: 'Dashboard',
        href: '/',
        icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
      },
      {
        id: 'projects',
        label: 'Projects',
        href: '/projects',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        id: 'wbs',
        label: 'WBS',
        href: '/wbs',
        icon: 'M4 6h16M4 10h16M4 14h16M4 18h16',
      },
    ]
  },
  {
    group: 'FINANCIAL',
    items: [
      {
        id: 'budget',
        label: 'Budget',
        href: '/budget',
        icon: 'M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
      },
      {
        id: 'costs',
        label: 'Costs',
        href: '/costs',
        icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        id: 'revenue',
        label: 'Revenue',
        href: '/revenue',
        icon: 'M13 7h8m0 0v8m0-8l-8 8-4-4-6 6',
      },
      {
        id: 'debt',
        label: 'Accounts',
        href: '/debt',
        icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
      },
    ]
  },
  {
    group: 'REPORTING',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      },
    ]
  },
];

const bottomItem = {
  id: 'system',
  label: 'Settings',
  href: '/system',
  icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
};

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
      {/* Logo Section */}
      <div style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        padding: '0 var(--sp-16)',
        borderBottom: '1px solid var(--border)',
        gap: 'var(--sp-12)',
      }}>
        <div style={{
          width: 36,
          height: 36,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 'var(--radius)',
          background: 'var(--brand)',
          color: 'white',
          flexShrink: 0,
        }}>
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        {!collapsed && (
          <div style={{
            overflow: 'hidden',
            minWidth: 0,
          }}>
            <div style={{
              fontSize: '14px',
              fontWeight: 700,
              color: 'var(--text-primary)',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              overflow: 'hidden',
            }}>Construction ERP</div>
            <div style={{
              fontSize: '10px',
              fontWeight: 700,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              marginTop: '2px',
            }}>Financial</div>
          </div>
        )}
      </div>

      {/* Main Navigation */}
      <nav style={{
        flex: 1,
        overflowY: 'auto',
        padding: 'var(--sp-12)',
        display: 'flex',
        flexDirection: 'column',
        gap: 'var(--sp-12)',
      }}>
        {mainMenuItems.map((group) => (
          <div key={group.group}>
            {!collapsed && (
              <div className="nav-section-title">{group.group}</div>
            )}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
            }}>
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <button
                    key={item.id}
                    onClick={() => router.push(item.href)}
                    className="nav-item"
                    style={{
                      borderLeftColor: active ? 'var(--brand)' : 'transparent',
                      backgroundColor: active ? 'var(--brand-light)' : 'transparent',
                      color: active ? 'var(--brand)' : 'var(--text-secondary)',
                      fontWeight: active ? 600 : 400,
                    }}
                  >
                    <svg
                      viewBox="0 0 24 24"
                      width="18"
                      height="18"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      style={{ flexShrink: 0 }}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                    </svg>
                    {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{item.label}</span>}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom Section */}
      <div style={{
        borderTop: '1px solid var(--border)',
        padding: 'var(--sp-12)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
      }}>
        <button
          onClick={() => router.push(bottomItem.href)}
          className="nav-item"
          style={{
            borderLeftColor: isActive(bottomItem.href) ? 'var(--brand)' : 'transparent',
            backgroundColor: isActive(bottomItem.href) ? 'var(--brand-light)' : 'transparent',
            color: isActive(bottomItem.href) ? 'var(--brand)' : 'var(--text-secondary)',
            fontWeight: isActive(bottomItem.href) ? 600 : 400,
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{ flexShrink: 0 }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d={bottomItem.icon} />
          </svg>
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>{bottomItem.label}</span>}
        </button>

        {/* Collapse Toggle */}
        <button
          onClick={onToggle}
          className="nav-item"
          style={{
            marginTop: 'var(--sp-8)',
            justifyContent: collapsed ? 'center' : 'flex-start',
          }}
        >
          <svg
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            style={{
              flexShrink: 0,
              transform: collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s ease',
            }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!collapsed && <span style={{ whiteSpace: 'nowrap' }}>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
