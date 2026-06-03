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

function TraceAmount({
  value,
  label,
  onClick
}: {
  value: number;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      className="font-mono font-bold tabular-nums text-[var(--primary)] underline-offset-2 hover:underline"
      title={label}
    >
      {formatVnd(value)}
    </button>
  );
}

export function ProjectProfitabilityTable({
  data,
  isLoading,
  onDrillDown
}: {
  data: ProjectProfitabilityRow[];
  isLoading: boolean;
  onDrillDown?: (row: ProjectProfitabilityRow, metric: FinancialMetricKey, title: string, amount: number) => void;
}) {
  const openTrace = (row: ProjectProfitabilityRow, metric: FinancialMetricKey, title: string, amount: number) => {
    onDrillDown?.(row, metric, title, amount);
  };

  const columns: Column<ProjectProfitabilityRow>[] = [
    {
      header: "Công trình",
      accessor: (row) => row.projectName,
      width: "25%"
    },
    {
      header: "Hợp đồng (Giá trị)",
      accessor: (row) => (
        <TraceAmount
          value={row.contractValue}
          label="Xem chi tiết giá trị hợp đồng"
          onClick={() => openTrace(row, "contractValue", `Truy vết giá trị hợp đồng: ${row.projectName}`, row.contractValue)}
        />
      ),
      align: "right",
      width: "15%"
    },
    {
      header: "Doanh thu hạch toán",
      accessor: (row) => (
        <TraceAmount
          value={row.revenue}
          label="Xem chi tiết doanh thu"
          onClick={() => openTrace(row, "revenue", `Truy vết doanh thu: ${row.projectName}`, row.revenue)}
        />
      ),
      align: "right",
      width: "15%"
    },
    {
      header: "Chi phí hạch toán",
      accessor: (row) => (
        <TraceAmount
          value={row.cost}
          label="Xem chi tiết chi phí"
          onClick={() => openTrace(row, "cost", `Truy vết chi phí: ${row.projectName}`, row.cost)}
        />
      ),
      align: "right",
      width: "15%"
    },
    {
      header: "Lãi/Lỗ",
      accessor: (row) => (
        <TraceAmount
          value={row.profit}
          label="Xem chi tiết lãi/lỗ"
          onClick={() => openTrace(row, "profit", `Truy vết lãi/lỗ: ${row.projectName}`, row.profit)}
        />
      ),
      align: "right",
      width: "15%"
    },
    {
      header: "Margin",
      accessor: (row) => `${Number(row.profitMargin || 0).toFixed(1)}%`,
      align: "center",
      width: "5%"
    },
    {
      header: "Trạng thái",
      accessor: (row) => (
        <EnterpriseBadge variant={row.riskLevel === "HIGH" ? "error" : row.riskLevel === "MEDIUM" ? "warning" : "success"}>
          {row.riskLevel === "HIGH" ? "Rủi ro cao" : row.riskLevel === "MEDIUM" ? "Cần theo dõi" : "Ổn định"}
        </EnterpriseBadge>
      ),
      align: "center",
      width: "10%"
    }
  ];

  return (
    <EnterpriseTable
      data={data || []}
      columns={columns}
      loading={isLoading}
      emptyState={
        <EnterpriseEmptyState
          title="Chưa có dữ liệu dự án"
          description="Chưa có công trình nào phát sinh doanh thu hoặc chi phí."
          iconType="report"
        />
      }
    />
  );
}
