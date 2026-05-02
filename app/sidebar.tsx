'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { NavigationItem } from '@/types';

interface SidebarProps {
  active?: NavigationItem;
}

export default function Sidebar({ active = 'overview' }: SidebarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const menuItems: { key: NavigationItem; label: string; href: string; icon: string }[] = [
    { key: 'overview', label: 'Tổng quan', href: '/', icon: '📊' },
    { key: 'projects', label: 'Dự án', href: '/projects-page', icon: '📁' },
    { key: 'wbs', label: 'Hạng mục công trình', href: '/wbs-page', icon: '🏗️' },
    { key: 'costs', label: 'Chi phí', href: '/costs-page', icon: '💰' },
    { key: 'debts', label: 'Công nợ', href: '/debts-page', icon: '📋' },
    { key: 'reports', label: 'Báo cáo', href: '/reports-page', icon: '📈' },
  ];

  return (
    <aside
      className={`${
        collapsed ? 'w-20' : 'w-64'
      } bg-gradient-to-b from-slate-900 to-slate-800 border-r border-slate-700 transition-all duration-300 flex flex-col`}
    >
      {/* Header */}
      <div className='p-6 border-b border-slate-700'>
        <div className='flex items-center justify-between'>
          {!collapsed && (
            <h1 className='text-xl font-bold text-white'>BuildERP</h1>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className='p-1.5 hover:bg-slate-700 rounded-lg text-slate-300 transition-colors'
            title={collapsed ? 'Expand' : 'Collapse'}
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
      </div>

      {/* Menu */}
      <nav className='flex-1 p-4 space-y-2'>
        {menuItems.map((item) => (
          <Link
            key={item.key}
            href={item.href}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
              active === item.key
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:bg-slate-700'
            }`}
            title={collapsed ? item.label : undefined}
          >
            <span className='text-lg'>{item.icon}</span>
            {!collapsed && <span className='font-medium'>{item.label}</span>}
          </Link>
        ))}
      </nav>

      {/* Footer */}
      <div className='p-4 border-t border-slate-700'>
        <div className={`text-xs text-slate-400 ${collapsed ? 'text-center' : ''}`}>
          {!collapsed && <p>© 2026 BuildERP</p>}
          {collapsed && <p>©</p>}
        </div>
      </div>
    </aside>
  );
}
