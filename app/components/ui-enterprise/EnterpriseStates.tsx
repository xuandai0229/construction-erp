"use client";

import React from "react";

interface EnterpriseLoadingStateProps {
  message?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function EnterpriseLoadingState({
  message = "Đang tải dữ liệu...",
  size = "md",
  className = "",
}: EnterpriseLoadingStateProps) {
  const sizeMap = { sm: "h-6 w-6", md: "h-8 w-8", lg: "h-12 w-12" };
  return (
    <div className={`flex flex-col items-center justify-center py-12 gap-4 ${className}`}>
      <div
        className={`${sizeMap[size]} rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin`}
      />
      <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
        {message}
      </p>
    </div>
  );
}

interface EnterpriseSkeletonProps {
  rows?: number;
  className?: string;
}

export function EnterpriseSkeleton({ rows = 5, className = "" }: EnterpriseSkeletonProps) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="h-10 w-full animate-pulse rounded-[var(--radius-sm)] bg-[var(--secondary)]"
          style={{ opacity: 1 - i * 0.15 }}
        />
      ))}
    </div>
  );
}

interface EnterpriseErrorStateProps {
  title?: string;
  description?: string;
  onRetry?: () => void;
  className?: string;
}

export function EnterpriseErrorState({
  title = "Đã xảy ra lỗi",
  description = "Không thể tải dữ liệu. Vui lòng thử lại.",
  onRetry,
  className = "",
}: EnterpriseErrorStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center p-8 border border-dashed border-rose-500/30 rounded-[var(--radius-sm)] bg-rose-500/5 select-none ${className}`}
    >
      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-rose-500/10 border border-rose-500/20 mb-4">
        <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
      </div>
      <h4 className="text-xs font-bold text-rose-500 mb-1 uppercase tracking-wider">{title}</h4>
      <p className="text-[10px] text-[var(--text-tertiary)] max-w-xs mb-4 leading-relaxed">{description}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="h-[34px] px-4 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-[var(--radius-sm)] transition-colors cursor-pointer"
        >
          Thử lại
        </button>
      )}
    </div>
  );
}
