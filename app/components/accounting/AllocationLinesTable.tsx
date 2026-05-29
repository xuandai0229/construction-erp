'use client';

import React from 'react';
import { formatVnd } from '@/app/components/dashboard-data';
import { Column, EnterpriseTable, EnterpriseBadge } from '@/app/components/ui-enterprise';

interface AllocationLine {
  id: string;
  invoiceId: string;
  paymentId: string;
  amount: number | string;
  status: string;
  createdAt: string | Date;
  isReversed?: boolean;
  reversalReason?: string;
  reversedAt?: string | Date;
}

interface AllocationLinesTableProps {
  allocations: AllocationLine[];
  loading?: boolean;
  className?: string;
}

export default function AllocationLinesTable({ allocations, loading = false, className = "" }: AllocationLinesTableProps) {
  const columns: Column<AllocationLine>[] = [
    {
      header: "Mã phân bổ",
      accessor: (row) => <span className="font-mono font-bold text-[var(--text-primary)]">{row.id.substring(0, 8).toUpperCase()}</span>,
      width: "15%",
      align: "center"
    },
    {
      header: "Mã Hóa đơn",
      accessor: (row) => <span className="font-mono text-[var(--text-secondary)]">{row.invoiceId.substring(0, 8).toUpperCase()}</span>,
      width: "15%",
      align: "center"
    },
    {
      header: "Mã Thanh toán",
      accessor: (row) => <span className="font-mono text-[var(--text-secondary)]">{row.paymentId.substring(0, 8).toUpperCase()}</span>,
      width: "15%",
      align: "center"
    },
    {
      header: "Số tiền phân bổ",
      accessor: (row) => <span className="font-mono font-black text-emerald-500">{formatVnd(Number(row.amount))}</span>,
      width: "18%",
      align: "right"
    },
    {
      header: "Ngày ghi nhận",
      accessor: (row) => new Date(row.createdAt).toLocaleDateString("vi-VN"),
      width: "15%",
      align: "center"
    },
    {
      header: "Trạng thái",
      accessor: (row) => {
        const isReversed = row.status === "REVERSED" || row.isReversed;
        return (
          <EnterpriseBadge variant={isReversed ? "error" : "success"}>
            {isReversed ? "ĐÃ ĐẢO" : "HIỆU LỰC"}
          </EnterpriseBadge>
        );
      },
      width: "12%",
      align: "center"
    },
    {
      header: "Ghi chú lý do",
      accessor: (row) => row.reversalReason || "-",
      width: "15%"
    }
  ];

  return (
    <div className={`space-y-3 select-none ${className}`}>
      <h4 className="text-[10px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Chi tiết phân bổ công nợ (AR Allocations)</h4>
      <div className="border border-[var(--border)] rounded-lg overflow-hidden bg-[var(--card)]">
        <EnterpriseTable
          data={allocations}
          columns={columns}
          loading={loading}
          minWidth="600px"
          emptyState={
            <div className="text-center py-6 text-xs text-[var(--text-tertiary)]">
              Chưa có chi tiết phân bổ thanh toán nào được thực hiện.
            </div>
          }
        />
      </div>
    </div>
  );
}
