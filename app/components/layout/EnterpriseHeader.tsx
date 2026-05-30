'use client';

import React from 'react';
import { useERPStore } from '@/store/erpStore';
import Link from 'next/link';

interface EnterpriseHeaderProps {
  title: string;
  subtitle?: string;
  breadcrumbs?: Array<{ label: string; href?: string }>;
  actions?: React.ReactNode;
}

export default function EnterpriseHeader({ title, subtitle, breadcrumbs, actions }: EnterpriseHeaderProps) {
  const { setMobileMenuOpen } = useERPStore();

  return (
    <header className="h-[var(--erp-header-height)] shrink-0 border-b border-[var(--border)] bg-[var(--background)] px-6 flex items-center justify-between z-40 sticky top-0">
      <div className="flex items-center gap-4 min-w-0">
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className="md:hidden p-2 -ml-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="min-w-0">
          {breadcrumbs && breadcrumbs.length > 0 && (
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[var(--text-tertiary)] mb-1">
              {breadcrumbs.map((bc, idx) => (
                <React.Fragment key={idx}>
                  {bc.href ? (
                    <Link href={bc.href} className="hover:text-[var(--primary)] transition-colors">
                      {bc.label}
                    </Link>
                  ) : (
                    <span className="text-[var(--text-secondary)]">{bc.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && <span className="text-[var(--divider)]">/</span>}
                </React.Fragment>
              ))}
            </div>
          )}
          <h1 className="text-[18px] font-black tracking-tight text-[var(--text-primary)] truncate">{title}</h1>
          {subtitle && <p className="text-[12px] font-medium text-[var(--text-secondary)] mt-0.5 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex items-center gap-3 shrink-0 ml-4">{actions}</div>}
    </header>
  );
}
