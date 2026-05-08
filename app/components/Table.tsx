'use client';

import React from 'react';

interface TableColumn<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  render?: (value: any, row: T, index: number) => React.ReactNode;
}

interface TableProps<T extends Record<string, any>> {
  columns: TableColumn<T>[];
  data: T[];
  rowKey?: keyof T | ((row: T, index: number) => string);
  onRowClick?: (row: T, index: number) => void;
  striped?: boolean;
  compact?: boolean;
  loading?: boolean;
}

export default function Table<T extends Record<string, any>>({
  columns,
  data,
  rowKey = 'id',
  onRowClick,
  striped = true,
  compact = false,
  loading = false,
}: TableProps<T>) {
  const getRowKey = (row: T, index: number) => {
    if (typeof rowKey === 'function') {
      return rowKey(row, index);
    }
    return String(row[rowKey]);
  };

  return (
    <div
      style={{
        width: '100%',
        overflowX: 'auto',
        borderRadius: 'var(--radius)',
        border: '1px solid var(--border)',
      }}
    >
      <table
        className={`erp-table ${striped ? 'zebra' : ''}`}
        style={{
          width: '100%',
          borderCollapse: 'collapse',
          backgroundColor: 'var(--bg-surface)',
          fontSize: '13px',
        }}
      >
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                key={String(col.key)}
                style={{
                  height: '44px',
                  padding: '0 var(--sp-12)',
                  backgroundColor: 'var(--bg-subtle)',
                  borderBottom: '1px solid var(--border)',
                  color: 'var(--text-secondary)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  textAlign: col.align || 'left',
                  whiteSpace: 'nowrap',
                  position: 'sticky',
                  top: 0,
                  zIndex: 10,
                  width: col.width,
                  letterSpacing: '0.05em',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={getRowKey(row, rowIndex)}
              onClick={() => onRowClick?.(row, rowIndex)}
              style={{
                cursor: onRowClick ? 'pointer' : 'default',
                transition: 'background-color 0.15s ease',
              }}
              onMouseEnter={(e) => {
                if (onRowClick) {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                    'var(--bg-muted)';
                }
              }}
              onMouseLeave={(e) => {
                if (onRowClick && striped && rowIndex % 2 === 1) {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                    '#F9FAFB';
                } else if (onRowClick) {
                  (e.currentTarget as HTMLTableRowElement).style.backgroundColor =
                    'transparent';
                }
              }}
            >
              {columns.map((col) => (
                <td
                  key={String(col.key)}
                  style={{
                    height: '44px',
                    padding: '8px var(--sp-12)',
                    borderBottom: '1px solid var(--border)',
                    color: 'var(--text-primary)',
                    verticalAlign: 'middle',
                    textAlign: col.align || 'left',
                  }}
                >
                  {col.render
                    ? col.render(row[col.key as keyof T], row, rowIndex)
                    : row[col.key as keyof T]}
                </td>
              ))}
            </tr>
          ))}

          {/* Empty State */}
          {data.length === 0 && !loading && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  height: '120px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  paddingTop: '40px',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                No data available
              </td>
            </tr>
          )}

          {/* Loading State */}
          {loading && (
            <tr>
              <td
                colSpan={columns.length}
                style={{
                  height: '120px',
                  textAlign: 'center',
                  color: 'var(--text-muted)',
                  fontSize: '14px',
                  paddingTop: '40px',
              }}
              >
                Loading...
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
