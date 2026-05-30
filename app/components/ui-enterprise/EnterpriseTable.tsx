"use client";

import React from "react";

export interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  minWidth?: string;
  className?: string;
  headerClassName?: string;
}

interface EnterpriseTableProps<T> {
  data: T[];
  columns: Column<T>[];
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyState?: React.ReactNode;
  className?: string;
  minWidth?: string;
  footer?: React.ReactNode;
  getRowKey?: (row: T, index: number) => React.Key;
  rowClassName?: (row: T, index: number) => string;
}

function getAlignClass(align?: Column<unknown>["align"], isHeader = false) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return isHeader ? "text-left" : "text-left";
}

export function EnterpriseTable<T>({
  data,
  columns,
  stickyHeader = true,
  onRowClick,
  loading = false,
  emptyState,
  className = "",
  minWidth = "960px",
  footer,
  getRowKey,
  rowClassName
}: EnterpriseTableProps<T>) {
  return (
    <div className={`relative overflow-x-auto overflow-y-hidden w-full border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--card)] scrollbar-thin ${className}`}>
      <table className="w-full table-fixed border-collapse text-left text-xs" style={{ minWidth }}>
        <colgroup>
          {columns.map((col, idx) => (
            <col key={idx} style={{ width: col.width, minWidth: col.minWidth || col.width }} />
          ))}
        </colgroup>
        <thead className={`${stickyHeader ? "sticky top-0 z-10" : ""} bg-[var(--table-head-bg)] border-b border-[var(--border)]`}>
          <tr className="h-[40px]">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`px-4 text-[12px] font-bold text-[var(--text-tertiary)] uppercase select-none whitespace-nowrap ${getAlignClass(col.align, true)} ${col.headerClassName || ""}`}
                style={{ width: col.width, minWidth: col.minWidth || col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="h-40">
              <td colSpan={columns.length} className="text-center text-[var(--text-tertiary)] bg-[var(--card)]">
                <div className="sticky left-0 mx-auto w-full flex items-center justify-center space-x-2 p-4">
                  <div className="w-4 h-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                  <span className="text-[12px]">Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr className="h-40">
              <td colSpan={columns.length} className="text-center bg-[var(--card)]">
                <div className="sticky left-0 mx-auto w-full flex items-center justify-center p-4">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center p-8 text-[var(--text-tertiary)]">
                      <span className="text-[12px]">Chưa có giao dịch để hiển thị</span>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIdx) : rowIdx}
                onClick={() => onRowClick?.(row)}
                className={`h-[40px] border-b border-[var(--divider)] last:border-b-0 transition-colors duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-standard)] hover:bg-[var(--table-row-hover)] ${
                  onRowClick ? "cursor-pointer" : ""
                } ${rowClassName?.(row, rowIdx) || ""}`}
              >
                {columns.map((col, colIdx) => {
                  const value = col.accessor(row);
                  const isRight = col.align === "right";
                  const isCenter = col.align === "center";
                  const alignClass = isRight
                    ? "text-right tabular-nums font-mono font-medium text-[var(--text-primary)] whitespace-nowrap"
                    : isCenter
                    ? "text-center text-[var(--text-secondary)] whitespace-nowrap"
                    : "text-left text-[var(--text-secondary)]";
                  const overflowClass = isRight || isCenter ? "" : "truncate overflow-hidden";

                  return (
                    <td
                      key={colIdx}
                      className={`px-4 align-middle text-[12px] leading-5 ${alignClass} ${overflowClass} ${col.className || ""}`}
                      style={{ width: col.width, minWidth: col.minWidth || col.width }}
                      title={typeof value === "string" ? value : undefined}
                    >
                      {value}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
        {footer && (
          <tfoot className="sticky bottom-0 z-10 bg-[var(--table-head-bg)] border-t border-[var(--border)]">
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  );
}
