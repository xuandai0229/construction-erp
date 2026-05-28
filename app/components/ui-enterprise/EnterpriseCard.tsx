"use client";

import React from "react";

interface EnterpriseCardProps {
  title?: string;
  subtitle?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function EnterpriseCard({
  title,
  subtitle,
  headerActions,
  children,
  className = "",
  bodyClassName = ""
}: EnterpriseCardProps) {
  return (
    <div
      className={`border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--card)] shadow-[var(--erp-card-shadow)] overflow-hidden transition-all duration-[var(--motion-duration-fast)] ease-[var(--motion-easing-executive)] ${className}`}
    >
      {(title || subtitle || headerActions) && (
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[var(--border)] bg-[var(--table-head-bg)]/30 select-none min-h-[48px]">
          <div className="flex flex-col space-y-0.5">
            {title && <h3 className="text-xs font-bold text-[var(--text-primary)] uppercase tracking-wider">{title}</h3>}
            {subtitle && <span className="text-[10px] text-[var(--text-tertiary)]">{subtitle}</span>}
          </div>
          {headerActions && <div className="flex items-center space-x-2">{headerActions}</div>}
        </div>
      )}
      <div className={`p-5 ${bodyClassName}`}>{children}</div>
    </div>
  );
}
