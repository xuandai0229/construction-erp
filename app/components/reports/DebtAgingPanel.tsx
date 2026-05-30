"use client";

import React from "react";
import { formatVnd } from "../dashboard-data";
import { EnterpriseTable, Column, EnterpriseEmptyState } from "../ui-enterprise";

export function DebtAgingPanel({ data, isLoading }: { data: any, isLoading: boolean }) {
  const aging = data?.agingBuckets || { notDue: 0, days1_30: 0, days31_60: 0, days61_90: 0, over90: 0 };
  const overdueInvoices = data?.overdueInvoices || [];

  const cols: Column<any>[] = [
    { header: "Số Hóa đơn", accessor: (row) => row.invoiceNumber || row.id, width: "20%", minWidth: "120px" },
    { header: "Hợp đồng", accessor: (row) => row.contractName, width: "40%", minWidth: "220px" },
    { header: "Phải thu còn lại", accessor: (row) => formatVnd(row.remainingAmount), align: "right", width: "20%", minWidth: "140px" },
    { header: "Số ngày quá hạn", accessor: (row) => <span className="text-rose-500 font-bold">{row.daysOverdue} ngày</span>, align: "center", width: "20%", minWidth: "140px" }
  ];

  return (
    <div className="space-y-6">
      {/* Aging Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="p-3 bg-[var(--secondary)] border border-[var(--border)] rounded-xl text-center shadow-sm select-none hover:border-[var(--primary)]/35 transition-colors">
          <div className="text-[10px] uppercase font-bold text-[var(--text-tertiary)]">Chưa đến hạn</div>
          <div className="text-sm font-black text-[var(--text-primary)] mt-1">{formatVnd(aging.notDue)}</div>
        </div>
        <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-center shadow-sm select-none hover:border-blue-500/40 transition-colors">
          <div className="text-[10px] uppercase font-bold text-blue-500">Quá hạn 1-30 ngày</div>
          <div className="text-sm font-black text-blue-500 mt-1">{formatVnd(aging.days1_30)}</div>
        </div>
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center shadow-sm select-none hover:border-amber-500/40 transition-colors">
          <div className="text-[10px] uppercase font-bold text-amber-500">Quá hạn 31-60 ngày</div>
          <div className="text-sm font-black text-amber-500 mt-1">{formatVnd(aging.days31_60)}</div>
        </div>
        <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl text-center shadow-sm select-none hover:border-orange-500/40 transition-colors">
          <div className="text-[10px] uppercase font-bold text-orange-500">Quá hạn 61-90 ngày</div>
          <div className="text-sm font-black text-orange-500 mt-1">{formatVnd(aging.days61_90)}</div>
        </div>
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center shadow-sm select-none hover:border-rose-500/40 transition-colors">
          <div className="text-[10px] uppercase font-bold text-rose-500">Quá hạn &gt;90 ngày</div>
          <div className="text-sm font-black text-rose-500 mt-1">{formatVnd(aging.over90)}</div>
        </div>
      </div>

      <EnterpriseTable
        data={overdueInvoices}
        columns={cols}
        loading={isLoading}
        emptyState={<EnterpriseEmptyState title="Không có hóa đơn quá hạn" description="Toàn bộ công nợ phải thu đang trong hạn thanh toán." iconType="voucher" />}
      />
    </div>
  );
}
