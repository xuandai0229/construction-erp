"use client";

import React from "react";

interface EnterprisePaginationProps {
  page: number;
  totalPages: number;
  totalItems?: number;
  onPageChange: (page: number) => void;
  isLoading?: boolean;
  className?: string;
}

export function EnterprisePagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
  isLoading = false,
  className = "",
}: EnterprisePaginationProps) {
  if (totalPages <= 1 && !totalItems) return null;

  return (
    <div className={`flex items-center justify-between pt-6 border-t border-[var(--border)] ${className}`}>
      <div className="flex flex-col gap-1">
        <div className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.2em] opacity-80">Phân trang</div>
        <div className="text-[12px] font-bold text-[var(--text-secondary)] flex items-center gap-2">
          {totalItems !== undefined && (
            <>
              Tổng cộng <span className="text-[var(--text-primary)] text-[14px] font-bold tabular-nums">{totalItems}</span> bản ghi
              <span className="h-3 w-[1px] bg-[var(--border)] mx-1" />
            </>
          )}
          Trang <span className="text-[var(--text-primary)] tabular-nums">{page}</span> / <span className="tabular-nums">{Math.max(1, totalPages)}</span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1 || isLoading}
          className="erp-btn h-9 px-4 rounded-xl bg-[var(--secondary)] border border-[var(--border)] text-[11px] text-[var(--text-secondary)] hover:text-[var(--text-primary)] disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Trang trước
        </button>

        <div className="flex items-center gap-1 hidden sm:flex">
          {Array.from({ length: totalPages }).map((_, i) => {
            const p = i + 1;
            // Simplified logic to show first, last, current, and +/- 1 surrounding pages
            if (p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1)) {
              return (
                <button
                  key={i}
                  onClick={() => onPageChange(p)}
                  className={`h-9 w-9 flex items-center justify-center rounded-xl text-[11px] font-bold transition-all tabular-nums ${
                    page === p
                      ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105"
                      : "text-[var(--text-muted)] hover:bg-[var(--secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  {p}
                </button>
              );
            } else if (p === page - 2 || p === page + 2) {
              return <span key={i} className="text-[var(--text-muted)] px-1">...</span>;
            }
            return null;
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages || isLoading}
          className="erp-btn h-9 px-4 rounded-xl bg-blue-600 text-white text-[11px] hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed"
        >
          Trang sau
        </button>
      </div>
    </div>
  );
}
