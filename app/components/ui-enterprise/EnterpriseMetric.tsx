"use client";

import React from "react";

interface EnterpriseMetricProps {
  title: string | React.ReactNode;
  value: string | number;
  description?: string;
  trend?: {
    value: string;
    direction: "up" | "down" | "neutral";
  };
  isLoading?: boolean;
  className?: string;
  onClick?: () => void;
}

export function EnterpriseMetric({
  title,
  value,
  description,
  trend,
  isLoading = false,
  className = "",
  onClick
}: EnterpriseMetricProps) {
  const Component = onClick ? "button" : "div";

  return (
    <Component
      type={onClick ? "button" : undefined}
      onClick={onClick}
      className={`group border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--card)] p-5 shadow-[var(--erp-card-shadow)] select-none flex min-h-[128px] flex-col space-y-3 text-left outline-none ${
        onClick ? "cursor-pointer transition-all duration-200 ease-out hover:-translate-y-0.5 hover:border-[var(--primary)]/60 hover:shadow-lg active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-[var(--primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)]" : ""
      } ${className}`}
      aria-label={onClick ? `${title}: ${value}. Mở chi tiết` : undefined}
    >
      <span className="flex items-center gap-2 text-[11px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider leading-4">{title}</span>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-7 w-2/3 animate-pulse rounded-md bg-[var(--muted)]" />
          <div className="h-3 w-full animate-pulse rounded-md bg-[var(--muted)]" />
        </div>
      ) : (
        <span className="text-xl font-black text-[var(--text-primary)] font-mono tabular-nums leading-tight">
          {value}
        </span>
      )}
      {(description || trend) && (
        <div className="mt-auto flex items-end justify-between gap-3 text-[11px] text-[var(--text-tertiary)]">
          {description && <span className="line-clamp-2 leading-4">{description}</span>}
          {trend && (
            <span
              className={`shrink-0 rounded-full px-2 py-1 text-[10px] font-bold ${
                trend.direction === "up"
                  ? "bg-emerald-500/10 text-emerald-600"
                  : trend.direction === "down"
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-[var(--secondary)] text-[var(--text-secondary)]"
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </Component>
  );
}
