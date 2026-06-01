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

function getAlignClass(align?: EnterpriseColumn<unknown>["align"], isHeader = false) {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return isHeader ? "text-left" : "text-left";
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
  const rowHeightClass = density === "compact" ? "h-[36px]" : "h-[46px]";
  const cellPaddingClass = density === "compact" ? "px-3 py-1.5" : "px-4 py-2.5";

  return (
    <div className={`relative overflow-x-auto overflow-y-hidden w-full border border-[var(--border)] rounded-lg bg-[var(--card)] scrollbar-thin shadow-sm ${className}`}>
      <table className="w-full table-fixed border-collapse text-left text-xs" style={{ minWidth }}>
        <colgroup>
          {columns.map((col, idx) => (
            <col key={col.key || idx} style={{ width: col.width, minWidth: col.minWidth || col.width }} />
          ))}
        </colgroup>
        <thead className={`${stickyHeader ? "sticky top-0 z-10" : ""} bg-[var(--secondary)] border-b border-[var(--border)]`}>
          <tr className="h-[40px]">
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                className={`px-4 text-[11px] font-bold text-[var(--text-secondary)] uppercase tracking-wider select-none whitespace-nowrap align-middle ${getAlignClass(col.align, true)} ${col.headerClassName || ""}`}
                style={{ width: col.width, minWidth: col.minWidth || col.width }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr className="h-44">
              <td colSpan={columns.length} className="text-center text-[var(--text-secondary)] bg-[var(--card)]">
                <div className="sticky left-0 mx-auto w-full flex flex-col items-center justify-center space-y-2 p-6">
                  <div className="w-6 h-6 rounded-full border-[2.5px] border-[var(--primary)] border-t-transparent animate-spin" />
                  <span className="text-[12px] font-medium text-[var(--text-secondary)]">Đang tải dữ liệu dữ toán...</span>
                </div>
              </td>
            </tr>
          ) : errorState ? (
            <tr className="h-44">
              <td colSpan={columns.length} className="text-center bg-[var(--card)]">
                <div className="sticky left-0 mx-auto w-full flex flex-col items-center justify-center p-6 text-rose-500">
                  {errorState}
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr className="h-44">
              <td colSpan={columns.length} className="text-center bg-[var(--card)]">
                <div className="sticky left-0 mx-auto w-full flex items-center justify-center p-6">
                  {emptyState || (
                    <div className="flex flex-col items-center justify-center p-8 text-[var(--text-secondary)]">
                      <svg className="w-8 h-8 text-[var(--text-tertiary)] mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                      <span className="text-[12px] font-semibold">Không tìm thấy dữ liệu phù hợp</span>
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
                className={`${rowHeightClass} border-b border-[var(--divider)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--table-row-hover)] ${
                  onRowClick ? "cursor-pointer" : ""
                } ${rowClassName?.(row, rowIdx) || ""}`}
              >
                {columns.map((col, colIdx) => {
                  const renderedValue = col.render(row);
                  const isRight = col.align === "right";
                  const isCenter = col.align === "center";
                  
                  const alignClass = isRight
                    ? "text-right tabular-nums font-mono font-medium text-[var(--text-primary)]"
                    : isCenter
                    ? "text-center text-[var(--text-secondary)]"
                    : "text-left text-[var(--text-secondary)]";

                  const overflowClass = col.truncate
                    ? "truncate max-w-[200px]"
                    : "whitespace-normal break-words";

                  // Extract text content if it's a simple string or number for the HTML title attribute
                  let titleValue: string | undefined = undefined;
                  if (typeof renderedValue === "string" || typeof renderedValue === "number") {
                    titleValue = String(renderedValue);
                  }

                  return (
                    <td
                      key={col.key || colIdx}
                      className={`${cellPaddingClass} align-middle text-[12px] leading-5 ${alignClass} ${overflowClass} ${col.className || ""}`}
                      style={{ width: col.width, minWidth: col.minWidth || col.width }}
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
          <tfoot className="sticky bottom-0 z-10 bg-[var(--secondary)] border-t border-[var(--border)] font-semibold text-[var(--text-primary)]">
            {footer}
          </tfoot>
        )}
      </table>
    </div>
  );
}
