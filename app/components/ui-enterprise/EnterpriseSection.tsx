"use client";

import React from "react";

interface EnterpriseSectionProps {
  title: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  divider?: boolean;
}

export function EnterpriseSection({
  title,
  subtitle,
  actions,
  children,
  className = "",
  divider = false
}: EnterpriseSectionProps) {
  return (
    <div className={`flex flex-col space-y-4 ${className} ${divider ? "pb-6 border-b border-[var(--border)]" : ""}`}>
      <div className="flex items-center justify-between select-none">
        <div className="flex flex-col space-y-0.5">
          <h2 className="text-xs font-bold uppercase tracking-wider text-[var(--text-tertiary)]">{title}</h2>
          {subtitle && <span className="text-[10px] text-[var(--text-tertiary)]">{subtitle}</span>}
        </div>
        {actions && <div className="flex items-center space-x-2">{actions}</div>}
      </div>
      <div className="w-full">{children}</div>
    </div>
  );
}
