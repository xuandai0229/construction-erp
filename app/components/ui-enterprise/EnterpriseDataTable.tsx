"use client";

import React from "react";

export interface EnterpriseColumn<T> {
  key: string;
  header: string;
  render: (row: T) => React.ReactNode;
  align?: "left" | "center" | "right";
  width?: string;
  minWidth?: string;
  truncate?: boolean;
  className?: string;
  headerClassName?: string;
}

interface EnterpriseDataTableProps<T> {
  data: T[];
  columns: EnterpriseColumn<T>[];
  stickyHeader?: boolean;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  errorState?: React.ReactNode;
  emptyState?: React.ReactNode;
  className?: string;
  minWidth?: string;
  footer?: React.ReactNode;
  getRowKey?: (row: T, index: number) => React.Key;
  rowClassName?: (row: T, index: number) => string;
  density?: "compact" | "comfortable";
}

function getEffectiveAlign<T>(column: EnterpriseColumn<T>): "left" | "center" | "right" {
  if (column.align) return column.align;

  const key = column.key.toLowerCase();
  const header = column.header.toLowerCase();
  if (key.includes("amount") || key.includes("total") || key.includes("price") || key.includes("value") || header.includes("tiền") || header.includes("giá trị") || header.includes("dự toán")) {
    return "right";
  }
  if (key.includes("date") || key.includes("status") || key.includes("action") || header.includes("ngày") || header.includes("trạng thái") || header.includes("thao tác")) {
    return "center";
  }
  return "left";
}

function getColumnWidth<T>(column: EnterpriseColumn<T>) {
  const key = column.key.toLowerCase();
  const header = column.header.toLowerCase();
  if (column.width || column.minWidth) {
    return { width: column.width, minWidth: column.minWidth || column.width };
  }
  if (key.includes("action") || header.includes("thao tác")) return { width: "88px", minWidth: "88px" };
  if (key.includes("status") || header.includes("trạng thái")) return { width: "132px", minWidth: "132px" };
  if (key.includes("date") || header.includes("ngày")) return { width: "132px", minWidth: "132px" };
  return { width: column.width, minWidth: column.minWidth || column.width };
}

function getAlignClass(align: "left" | "center" | "right") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return "text-left";
}

export function EnterpriseDataTable<T>({
  data,
  columns,
  stickyHeader = true,
  onRowClick,
  loading = false,
  errorState,
  emptyState,
  className = "",
  minWidth = "960px",
  footer,
  getRowKey,
  rowClassName,
  density = "comfortable",
}: EnterpriseDataTableProps<T>) {
  const rowHeightClass = density === "compact" ? "h-9" : "h-[46px]";
  const cellPaddingClass = density === "compact" ? "px-3 py-1.5" : "px-4 py-2.5";

  return (
    <div className={`relative w-full overflow-x-auto overflow-y-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-sm scrollbar-thin ${className}`}>
      <table className="w-full table-fixed border-collapse text-left text-xs" style={{ minWidth }}>
        <colgroup>
          {columns.map((column, index) => {
            const sizing = getColumnWidth(column);
            return <col key={column.key || index} style={sizing} />;
          })}
        </colgroup>
        <thead className={`${stickyHeader ? "sticky top-0 z-20" : ""} border-b border-[var(--border)] bg-[var(--secondary)] shadow-[0_1px_0_var(--border)]`}>
          <tr className="h-10">
            {columns.map((column, index) => {
              const align = getEffectiveAlign(column);
              const sizing = getColumnWidth(column);
              return (
                <th
                  key={column.key || index}
                  className={`px-4 align-middle text-[11px] font-bold uppercase tracking-wider text-[var(--text-secondary)] select-none whitespace-nowrap ${getAlignClass(align)} ${column.headerClassName || ""}`}
                  style={sizing}
                  title={column.header}
                >
                  <span className="block truncate">{column.header}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="h-44">
              <td colSpan={columns.length} className="bg-[var(--card)] text-center text-[var(--text-secondary)]">
                <div className="sticky left-0 mx-auto flex w-full flex-col items-center justify-center gap-2 p-6">
                  <div className="h-6 w-6 rounded-full border-[2.5px] border-[var(--primary)] border-t-transparent animate-spin" />
                  <span className="text-[12px] font-medium text-[var(--text-secondary)]">Đang tải dữ liệu...</span>
                </div>
              </td>
            </tr>
          ) : errorState ? (
            <tr className="h-44">
              <td colSpan={columns.length} className="bg-[var(--card)] text-center">
                <div className="sticky left-0 mx-auto flex w-full flex-col items-center justify-center p-6 text-rose-500">
                  {errorState}
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr className="h-44">
              <td colSpan={columns.length} className="bg-[var(--card)] text-center">
                <div className="sticky left-0 mx-auto flex w-full items-center justify-center p-6">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center p-8 text-[var(--text-secondary)]">
                      <svg className="mb-2 h-8 w-8 text-[var(--text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-[12px] font-semibold">Không tìm thấy dữ liệu phù hợp với bộ lọc hiện tại.</span>
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
                className={`${rowHeightClass} border-b border-[var(--divider)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--table-row-hover)] ${onRowClick ? "cursor-pointer" : ""} ${rowClassName?.(row, rowIndex) || ""}`}
              >
                {columns.map((column, columnIndex) => {
                  const renderedValue = column.render(row);
                  const align = getEffectiveAlign(column);
                  const sizing = getColumnWidth(column);
                  const isAction = column.key.toLowerCase().includes("action") || column.header.toLowerCase().includes("thao tác");
                  const shouldTruncate = column.truncate !== false && align === "left";
                  const alignClass = align === "right"
                    ? "text-right tabular-nums font-mono font-medium text-[var(--text-primary)] whitespace-nowrap"
                    : align === "center"
                    ? "text-center text-[var(--text-secondary)] whitespace-nowrap"
                    : "text-left text-[var(--text-secondary)]";

                  const titleValue = typeof renderedValue === "string" || typeof renderedValue === "number"
                    ? String(renderedValue)
                    : undefined;

                  return (
                    <td
                      key={column.key || columnIndex}
                      className={`${cellPaddingClass} align-middle text-[12px] leading-5 ${alignClass} ${shouldTruncate ? "truncate overflow-hidden" : "break-words"} ${isAction ? "relative z-0" : ""} ${column.className || ""}`}
                      style={sizing}
                      title={titleValue}
                    >
                      {renderedValue}
                    </td>
                  );
                })}
              </tr>
            ))
          )}
        </tbody>
        {footer && (
          <tfoot className="sticky bottom-0 z-20 border-t border-[var(--border)] bg-[var(--secondary)] font-semibold text-[var(--text-primary)] shadow-[0_-1px_0_var(--border)]">
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  );
}
