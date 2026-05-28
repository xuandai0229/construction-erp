"use client";

import React from "react";

interface EnterpriseEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  iconType?: "voucher" | "debt" | "report" | "generic";
  className?: string;
}

export function EnterpriseEmptyState({
  title,
  description,
  actionLabel,
  onAction,
  iconType = "generic",
  className = ""
}: EnterpriseEmptyStateProps) {
  const renderIcon = () => {
    switch (iconType) {
      case "voucher":
        return (
          <svg className="w-8 h-8 text-[var(--text-tertiary)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        );
      case "debt":
        return (
          <svg className="w-8 h-8 text-[var(--text-tertiary)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case "report":
        return (
          <svg className="w-8 h-8 text-[var(--text-tertiary)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      default:
        return (
          <svg className="w-8 h-8 text-[var(--text-tertiary)] opacity-60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
        );
    }
  };

  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--card)]/40 select-none ${className}`}
    >
      <div className="flex items-center justify-center w-14 h-14 rounded-full bg-[var(--muted)]/50 mb-4 border border-[var(--border)]">
        {renderIcon()}
      </div>
      <h4 className="text-xs font-bold text-[var(--text-primary)] mb-1 uppercase tracking-wider">{title}</h4>
      <p className="text-[10px] text-[var(--text-tertiary)] max-w-xs mb-4 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="h-[34px] px-4 text-xs font-semibold text-[var(--primary-foreground)] bg-[var(--primary)] hover:bg-[var(--primary)]/90 border border-transparent rounded-[var(--radius-sm)] transition-colors duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-standard)] shadow-sm cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
