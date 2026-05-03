'use client';

import { useRouter, usePathname } from 'next/navigation';

const menuItems = [
  { id: 'overview', label: 'Tổng quan', href: '/', icon: 'M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z' },
  { id: 'projects', label: 'Dự án', href: '/projects', icon: 'M4 7h16M7 7V5h10v2M6 10h12v10H6z' },
  { id: 'wbs', label: 'Hạng mục công trình (WBS)', href: '/wbs', icon: 'M12 3v5m-6 4h12M6 12v5m12-5v5M4 17h4v4H4zm8 0h4v4h-4zm8 0h-4v4h4z' },
  { id: 'budget', label: 'Dự toán', href: '/budget', icon: 'M7 3h10v18H7zM10 7h4M10 11h4M10 15h2' },
  { id: 'costs', label: 'Chi phí', href: '/costs', icon: 'M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7H15a3.5 3.5 0 0 1 0 7H6' },
  { id: 'debt', label: 'Công nợ', href: '/debt', icon: 'M7 4h10a2 2 0 0 1 2 2v14l-3-2-3 2-3-2-3 2V6a2 2 0 0 1 2-2zM10 9h4M10 13h4' },
  { id: 'schedule', label: 'Tiến độ', href: '/schedule', icon: 'M12 6v6l4 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z' },
  { id: 'reports', label: 'Báo cáo', href: '/reports', icon: 'M5 19V5m0 14h14M9 16V9m4 7V7m4 9v-5' },
];

function IconPath({ path }: { path: string }) {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d={path} />
    </svg>
  );
}

export default function Sidebar({ activeItem }: { activeItem?: string }) {
  const router = useRouter();
  const pathname = usePathname();

  const isActive = (item: typeof menuItems[0]) => {
    if (activeItem) return activeItem === item.id;
    if (item.href === '/') return pathname === '/';
    return pathname.startsWith(item.href);
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[258px] flex-col border-r border-slate-800 bg-[#020617] shadow-2xl shadow-black/30">
      <div className="flex h-[74px] items-center gap-3 border-b border-slate-800 px-6">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-blue-500/40 bg-blue-600/20 text-blue-300">
          <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.7">
            <path d="M4 21V8l5-3 5 3v13" />
            <path d="M14 21V11l6 3v7M7 11h2M7 15h2M11 11h2M11 15h2M17 16h1" />
          </svg>
        </div>
        <div>
          <div className="text-[15px] font-bold text-slate-100">Construction ERP</div>
          <div className="text-xs text-slate-400">Quản lý dự án xây dựng</div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5">
        <div className="space-y-1.5">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => router.push(item.href)}
              className={`flex h-11 w-full items-center gap-3 rounded-md px-4 text-left text-[13px] font-medium transition-colors ${
                isActive(item)
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-950/40'
                  : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}
            >
              <IconPath path={item.icon} />
              <span className="truncate">{item.label}</span>
            </button>
          ))}
        </div>
      </nav>

      <button className="mx-3 mb-5 flex h-10 items-center gap-3 rounded-md px-4 text-sm text-slate-400 hover:bg-slate-900 hover:text-white">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="m15 18-6-6 6-6M21 18l-6-6 6-6" />
        </svg>
        Thu gọn
      </button>
    </aside>
  );
}
