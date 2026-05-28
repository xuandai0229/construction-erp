"use client";

import React from "react";

type BadgeVariant = "info" | "success" | "warning" | "error" | "neutral";

interface EnterpriseBadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function EnterpriseBadge({ children, variant = "neutral", className = "" }: EnterpriseBadgeProps) {
  const variantClasses = {
    neutral: "bg-[var(--muted)] text-[var(--text-tertiary)] border-[var(--border)]",
    info: "bg-blue-500/10 text-blue-400 border-blue-500/20",
    success: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
    warning: "bg-amber-500/10 text-amber-400 border-amber-500/20",
    error: "bg-rose-500/10 text-rose-400 border-rose-500/20"
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-[var(--radius-sm)] text-[10px] font-semibold border uppercase tracking-wider select-none ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
