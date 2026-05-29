"use client";

import React from "react";

interface EnterpriseMetricProps {
  title: string;
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
  return (
    <div
      onClick={onClick}
      className={`border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--card)] p-5 shadow-[var(--erp-card-shadow)] select-none flex flex-col space-y-2 min-h-[96px] ${
        onClick ? "cursor-pointer hover:border-[var(--primary)]/60 hover:bg-[var(--card)]/90 transition-all duration-150 active:scale-[0.98]" : ""
      } ${className}`}
    >
      <span className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider leading-none">{title}</span>
      {isLoading ? (
        <div className="h-6 w-2/3 bg-[var(--muted)] animate-pulse rounded-md"></div>
      ) : (
        <span className="text-lg font-bold text-[var(--text-primary)] font-mono tabular-nums leading-none tracking-tight">
          {value}
        </span>
      )}
      {(description || trend) && (
        <div className="flex items-center justify-between text-[10px] text-[var(--text-tertiary)] mt-1">
          {description && <span className="truncate">{description}</span>}
          {trend && (
            <span
              className={`font-bold ${
                trend.direction === "up"
                  ? "text-emerald-500"
                  : trend.direction === "down"
                  ? "text-rose-500"
                  : "text-[var(--text-tertiary)]"
              }`}
            >
              {trend.direction === "up" ? "↑" : trend.direction === "down" ? "↓" : "•"} {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
