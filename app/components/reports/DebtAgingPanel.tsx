"use client";

import React from "react";
import { formatVnd } from "../dashboard-data";
import { EnterpriseBadge } from "../ui-enterprise";

type AgingRow = {
  id: string;
  invoiceNumber?: string | null;
  projectCode?: string | null;
  projectName?: string | null;
  customerName?: string | null;
  contractName?: string | null;
  remainingAmount: number;
  daysOverdue: number;
  status?: string | null;
};

type DebtAgingData = {
  agingBuckets?: {
    notDue?: number;
    days1_30?: number;
    days31_60?: number;
    days61_90?: number;
    over90?: number;
  };
  overdueInvoices?: AgingRow[];
};

const bucketStyles = [
  "border-slate-500/25 bg-slate-500/10 text-slate-700 dark:text-slate-300",
  "border-blue-500/25 bg-blue-500/10 text-blue-700 dark:text-blue-300",
  "border-amber-500/25 bg-amber-500/10 text-amber-700 dark:text-amber-300",
  "border-orange-500/25 bg-orange-500/10 text-orange-700 dark:text-orange-300",
  "border-rose-500/25 bg-rose-500/10 text-rose-700 dark:text-rose-300",
];

function MiniEmptyState() {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] bg-[var(--secondary)]/40 px-4 py-5 text-center">
      <div className="text-sm font-black text-[var(--text-primary)]">Không có hóa đơn quá hạn</div>
      <p className="mx-auto mt-1 max-w-xl text-xs leading-5 text-[var(--text-secondary)]">
        Công nợ phải thu đang trong hạn thanh toán hoặc đã được tất toán trong phạm vi đang xem.
      </p>
    </div>
  );
}

function AgingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[0, 1, 2, 3, 4].map((item) => <div key={item} className="h-24 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--secondary)]" />)}
      </div>
      <div className="h-32 animate-pulse rounded-lg border border-[var(--border)] bg-[var(--secondary)]" />
    </div>
  );
}

export function DebtAgingPanel({ data, isLoading }: { data: DebtAgingData | null | undefined; isLoading: boolean }) {
  if (isLoading) return <AgingSkeleton />;

  const aging = data?.agingBuckets || { notDue: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
  const overdueInvoices: AgingRow[] = data?.overdueInvoices || [];
  const buckets = [
    { label: "Chưa đến hạn", value: aging.notDue },
    { label: "Quá hạn 1-30 ngày", value: aging.days1_30 },
    { label: "Quá hạn 31-60 ngày", value: aging.days31_60 },
    { label: "Quá hạn 61-90 ngày", value: aging.days61_90 },
    { label: "Quá hạn trên 90 ngày", value: aging.over90 },
  ];

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {buckets.map((bucket, index) => (
          <div key={bucket.label} className={`min-h-[92px] rounded-lg border p-4 transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/45 ${bucketStyles[index]}`}>
            <div className="text-[11px] font-black uppercase leading-4">{bucket.label}</div>
            <div className="mt-2 font-mono text-lg font-black tabular-nums">{formatVnd(bucket.value || 0)}</div>
          </div>
        ))}
      </div>

      {overdueInvoices.length === 0 ? (
        <MiniEmptyState />
      ) : (
        <div className="space-y-2">
          {overdueInvoices.slice(0, 6).map((row) => (
            <article key={row.id} className="grid gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-sm transition hover:border-[var(--primary)]/35 sm:grid-cols-[1.2fr_1fr_160px_110px] sm:items-center">
              <div className="min-w-0">
                <div className="font-mono text-xs font-black text-[var(--primary)]">{row.invoiceNumber || row.id.slice(0, 8).toUpperCase()}</div>
                <div className="mt-1 truncate text-sm font-bold text-[var(--text-primary)]">{row.customerName || "Chưa có khách hàng/chủ đầu tư"}</div>
                <div className="mt-1 truncate text-xs text-[var(--text-secondary)]">{row.contractName || "Chưa gắn hợp đồng"}</div>
              </div>
              <div className="min-w-0 text-xs text-[var(--text-secondary)]">
                <div className="font-bold text-[var(--text-primary)]">{row.projectCode || "CT-NA"}</div>
                <div className="mt-1 truncate">{row.projectName || "Chưa có công trình"}</div>
              </div>
              <div className="font-mono text-sm font-black tabular-nums text-[var(--text-primary)] sm:text-right">{formatVnd(row.remainingAmount)}</div>
              <div className="sm:text-right">
                <EnterpriseBadge variant="error">{row.daysOverdue.toLocaleString("vi-VN")} ngày</EnterpriseBadge>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
