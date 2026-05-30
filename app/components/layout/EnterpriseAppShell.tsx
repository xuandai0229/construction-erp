'use client';

import React from 'react';
import EnterpriseSidebar from './EnterpriseSidebar';
import { useERPStore } from '@/store/erpStore';

export default function EnterpriseAppShell({ children, activeItem }: { children: React.ReactNode; activeItem?: string }) {
  const { sidebarCollapsed } = useERPStore();
  
  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <EnterpriseSidebar activeItem={activeItem} />
      <main className={`erp-page-main flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 ease-[var(--motion-easing-standard)] ${sidebarCollapsed ? 'pl-[var(--erp-sidebar-collapsed)]' : 'pl-[var(--erp-sidebar-width)]'}`}>
        {children}
      </main>
    </div>
  );
}
