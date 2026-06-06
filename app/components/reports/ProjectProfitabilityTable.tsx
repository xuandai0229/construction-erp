"use client";

import React from "react";
import { formatVnd } from "../dashboard-data";
import { EnterpriseBadge, EnterpriseEmptyState, EnterpriseTable, Column } from "../ui-enterprise";
import { FinancialMetricKey } from "../accounting/FinancialDrilldownDrawer";

export interface ProjectProfitabilityRow {
  projectId: string;
  projectName: string;
  contractValue: number;
  revenue: number;
  cost: number;
  profit: number;
  profitMargin: number;
  riskLevel: "HIGH" | "MEDIUM" | "LOW" | string;
}

function DetailAmount({ value, label, onClick }: { value: number; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="font-mono font-bold tabular-nums text-[var(--primary)] underline-offset-2 outline-none transition hover:underline focus-visible:rounded focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60"
      title={label}
    >
      {formatVnd(value)}
    </button>
  );
}

function RiskBadge({ level }: { level: string }) {
  return (
    <EnterpriseBadge variant={level === "HIGH" ? "error" : level === "MEDIUM" ? "warning" : "success"}>
      {level === "HIGH" ? "Rủi ro cao" : level === "MEDIUM" ? "Cần theo dõi" : "Ổn định"}
    </EnterpriseBadge>
  );
}

export function ProjectProfitabilityTable({
  data,
  isLoading,
  onDrillDown,
}: {
  data: ProjectProfitabilityRow[];
  isLoading: boolean;
  onDrillDown?: (row: ProjectProfitabilityRow, metric: FinancialMetricKey, title: string, amount: number) => void;
}) {
  const openDetail = (row: ProjectProfitabilityRow, metric: FinancialMetricKey, title: string, amount: number) => {
    onDrillDown?.(row, metric, title, amount);
  };

  const rows = data || [];

  if (!isLoading && rows.length === 1) {
    const row = rows[0];
    return (
      <div className="space-y-4">
        <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">Công trình đang xem</div>
              <h3 className="mt-1 text-lg font-black text-[var(--text-primary)]">{row.projectName}</h3>
            </div>
            <RiskBadge level={row.riskLevel} />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <SummaryValue label="Giá trị hợp đồng" value={row.contractValue} onClick={() => openDetail(row, "contractValue", `Chi tiết giá trị hợp đồng: ${row.projectName}`, row.contractValue)} />
            <SummaryValue label="Doanh thu hạch toán" value={row.revenue} onClick={() => openDetail(row, "revenue", `Chi tiết doanh thu hạch toán: ${row.projectName}`, row.revenue)} />
            <SummaryValue label="Chi phí sản xuất" value={row.cost} onClick={() => openDetail(row, "cost", `Chi tiết chi phí sản xuất: ${row.projectName}`, row.cost)} />
            <SummaryValue label="Lợi nhuận gộp" value={row.profit} onClick={() => openDetail(row, "profit", `Chi tiết lợi nhuận gộp tạm tính: ${row.projectName}`, row.profit)} />
          </div>
        </div>
      </div>
    );
  }

  const columns: Column<ProjectProfitabilityRow>[] = [
    { header: "Công trình", accessor: (row) => row.projectName, width: "260px", minWidth: "220px" },
    {
      header: "Giá trị hợp đồng",
      accessor: (row) => <DetailAmount value={row.contractValue} label="Xem chi tiết giá trị hợp đồng" onClick={() => openDetail(row, "contractValue", `Chi tiết giá trị hợp đồng: ${row.projectName}`, row.contractValue)} />,
      align: "right",
      width: "165px",
    },
    {
      header: "Doanh thu",
      accessor: (row) => <DetailAmount value={row.revenue} label="Xem chi tiết doanh thu" onClick={() => openDetail(row, "revenue", `Chi tiết doanh thu hạch toán: ${row.projectName}`, row.revenue)} />,
      align: "right",
      width: "160px",
    },
    {
      header: "Chi phí",
      accessor: (row) => <DetailAmount value={row.cost} label="Xem chi tiết chi phí" onClick={() => openDetail(row, "cost", `Chi tiết chi phí sản xuất: ${row.projectName}`, row.cost)} />,
      align: "right",
      width: "160px",
    },
    {
      header: "Lãi/Lỗ",
      accessor: (row) => <DetailAmount value={row.profit} label="Xem chi tiết lãi/lỗ" onClick={() => openDetail(row, "profit", `Chi tiết lợi nhuận gộp tạm tính: ${row.projectName}`, row.profit)} />,
      align: "right",
      width: "150px",
    },
    { header: "Tỷ suất", accessor: (row) => `${Number(row.profitMargin || 0).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}%`, align: "center", width: "120px" },
    { header: "Trạng thái", accessor: (row) => <RiskBadge level={row.riskLevel} />, align: "center", width: "130px" },
  ];

  return (
    <EnterpriseTable
      data={rows}
      columns={columns}
      loading={isLoading}
      minWidth="1040px"
      emptyState={<EnterpriseEmptyState title="Chưa có dữ liệu công trình" description="Chưa có công trình phát sinh doanh thu hoặc chi phí trong phạm vi đang xem." iconType="report" />}
    />
  );
}

function SummaryValue({ label, value, onClick }: { label: string; value: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-lg border border-[var(--border)] bg-[var(--secondary)]/45 p-4 text-left transition hover:-translate-y-0.5 hover:border-[var(--primary)]/35 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--primary)]/60">
      <div className="text-[11px] font-bold uppercase tracking-wide text-[var(--text-tertiary)]">{label}</div>
      <div className="mt-2 font-mono text-lg font-black tabular-nums text-[var(--text-primary)]">{formatVnd(value)}</div>
    </button>
  );
}
