"use client";

import React from "react";

interface EnterpriseFilterBarProps {
  children: React.ReactNode;
  onClear?: () => void;
  className?: string;
}

export function EnterpriseFilterBar({ children, onClear, className = "" }: EnterpriseFilterBarProps) {
  return (
    <div
      className={`flex flex-wrap items-end gap-3 p-4 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-[var(--erp-card-shadow)] ${className}`}
    >
      <div className="flex flex-wrap items-end gap-3 flex-1">{children}</div>
      {onClear && (
        <button
          onClick={onClear}
          className="h-[38px] px-3 text-xs font-semibold text-[var(--text-tertiary)] hover:text-[var(--text-primary)] hover:bg-[var(--muted)] border border-transparent rounded-[var(--radius-sm)] transition-colors duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-standard)] select-none"
        >
          Xóa bộ lọc
        </button>
      )}
    </div>
  );
}
