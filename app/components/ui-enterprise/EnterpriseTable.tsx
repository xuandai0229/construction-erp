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

function getAlignClass(align?: Column<unknown>["align"]) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
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
    <div className={`relative w-full overflow-x-auto overflow-y-hidden rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] scrollbar-thin ${className}`}>
      <table className="w-full table-fixed border-collapse text-left text-xs" style={{ minWidth }}>
        <colgroup>
          {columns.map((column, index) => (
            <col key={index} style={{ width: column.width, minWidth: column.minWidth || column.width }} />
          ))}
        </colgroup>
        <thead className={`${stickyHeader ? "sticky top-0 z-20" : ""} border-b border-[var(--border)] bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)]`}>
          <tr className="h-10">
            {columns.map((column, index) => (
              <th
                key={index}
                className={`px-4 align-middle text-[12px] font-bold uppercase text-[var(--text-tertiary)] select-none whitespace-nowrap ${getAlignClass(column.align)} ${column.headerClassName || ""}`}
                style={{ width: column.width, minWidth: column.minWidth || column.width }}
                title={column.header}
              >
                <span className="block truncate">{column.header}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="h-40">
              <td colSpan={columns.length} className="bg-[var(--card)] text-center text-[var(--text-tertiary)]">
                <div className="sticky left-0 mx-auto flex w-full items-center justify-center gap-2 p-4">
                  <div className="h-4 w-4 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                  <span className="text-[12px]">Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr className="h-40">
              <td colSpan={columns.length} className="bg-[var(--card)] text-center">
                <div className="sticky left-0 mx-auto flex w-full items-center justify-center p-4">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center p-8 text-[var(--text-tertiary)]">
                      <span className="text-[12px]">Chưa có dữ liệu để hiển thị.</span>
                    </div>
                  )}
                </div>
              </td>
            </tr>
          ) : (
            data.map((row, rowIndex) => (
              <tr
                key={getRowKey ? getRowKey(row, rowIndex) : rowIndex}
                onClick={() => onRowClick?.(row)}
                className={`h-10 border-b border-[var(--divider)] last:border-b-0 transition-colors duration-[var(--motion-duration-instant)] ease-[var(--motion-easing-standard)] hover:bg-[var(--table-row-hover)] ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row, rowIndex) || ""}`}
              >
                {columns.map((column, columnIndex) => {
                  const value = column.accessor(row);
                  const alignClass = column.align === "right"
                    ? "text-right tabular-nums font-mono font-medium text-[var(--text-primary)] whitespace-nowrap"
                    : column.align === "center"
                    ? "text-center text-[var(--text-secondary)] whitespace-nowrap"
                    : "text-left text-[var(--text-secondary)] truncate overflow-hidden";

                  return (
                    <td
                      key={columnIndex}
                      className={`px-4 align-middle text-[12px] leading-5 ${alignClass} ${column.className || ""}`}
                      style={{ width: column.width, minWidth: column.minWidth || column.width }}
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
          <tfoot className="sticky bottom-0 z-20 border-t border-[var(--border)] bg-[var(--table-head-bg)] shadow-[0_-1px_0_var(--border)]">
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  );
}
