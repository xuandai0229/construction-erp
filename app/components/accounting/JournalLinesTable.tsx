'use client';

import React from 'react';
import { formatVnd } from '@/app/components/dashboard-data';
import { Column, EnterpriseTable } from '@/app/components/ui-enterprise';

interface TransactionLine {
  id?: string;
  accountCode: string;
  debit: number | string;
  credit: number | string;
  description?: string;
}

interface JournalEntry {
  id: string;
  date: string | Date;
  reference?: string;
  description?: string;
  lines: TransactionLine[];
}

interface JournalLinesTableProps {
  entries: JournalEntry[];
  loading?: boolean;
  className?: string;
}

export default function JournalLinesTable({ entries, loading = false, className = "" }: JournalLinesTableProps) {
  const flattenedLines = React.useMemo(() => {
    const list: any[] = [];
    entries.forEach(entry => {
      entry.lines.forEach((line, idx) => {
        list.push({
          ...line,
          entryId: entry.id,
          entryRef: entry.reference || entry.id.substring(0, 8).toUpperCase(),
          entryDate: new Date(entry.date).toLocaleDateString("vi-VN"),
          isFirst: idx === 0,
          spanCount: entry.lines.length
        });
      });
    });
    return list;
  }, [entries]);

  const columns: Column<any>[] = [
    {
      header: "Chứng từ gốc",
      accessor: (row) => <span className="font-mono font-bold text-blue-500">{row.entryRef}</span>,
      width: "15%",
      align: "center"
    },
    {
      header: "Ngày hạch toán",
      accessor: (row) => row.entryDate,
      width: "15%",
      align: "center"
    },
    {
      header: "Tài khoản",
      accessor: (row) => <span className="font-mono font-extrabold text-[var(--text-primary)]">{row.accountCode}</span>,
      width: "12%",
      align: "center"
    },
    {
      header: "Bên Nợ (Debit)",
      accessor: (row) => Number(row.debit) > 0 ? (
        <span className="font-mono font-extrabold text-blue-500">{formatVnd(Number(row.debit))}</span>
      ) : "-",
      width: "18%",
      align: "right"
    },
    {
      header: "Bên Có (Credit)",
      accessor: (row) => Number(row.credit) > 0 ? (
        <span className="font-mono font-extrabold text-amber-500">{formatVnd(Number(row.credit))}</span>
      ) : "-",
      width: "18%",
      align: "right"
    },
    {
      header: "Diễn giải hạch toán",
      accessor: (row) => row.description || "Hạch toán tự động",
      width: "22%"
    }
  ];

  return (
    <div className={`space-y-3 select-none ${className}`}>
      <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Hạch toán kép Sổ cái (Double-Entry Ledger)</h4>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
        <EnterpriseTable
          data={flattenedLines}
          columns={columns}
          loading={loading}
          minWidth="600px"
          emptyState={
            <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
              Chưa có bút toán ghi sổ hạch toán nào được ghi nhận.
            </div>
          }
        />
      </div>
    </div>
  );
}
