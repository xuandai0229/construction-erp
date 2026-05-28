"use client";

import React from "react";

interface EnterpriseToolbarProps {
  title?: string;
  leftActions?: React.ReactNode;
  rightActions?: React.ReactNode;
  className?: string;
}

export function EnterpriseToolbar({
  title,
  leftActions,
  rightActions,
  className = ""
}: EnterpriseToolbarProps) {
  return (
    <div
      className={`flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 bg-[var(--card)] border border-[var(--border)] rounded-[var(--radius-sm)] shadow-[var(--erp-card-shadow)] gap-3 select-none ${className}`}
    >
      {title && (
        <div className="flex items-center space-x-2">
          <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">{title}</h1>
        </div>
      )}
      <div className="flex items-center flex-wrap gap-2">{leftActions}</div>
      <div className="flex items-center flex-wrap gap-2 sm:ml-auto">{rightActions}</div>
    </div>
  );
}
