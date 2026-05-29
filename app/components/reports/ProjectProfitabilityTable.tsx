"use client";

import React from "react";
import { formatVnd } from "../dashboard-data";
import { EnterpriseTable, Column, EnterpriseBadge, EnterpriseEmptyState } from "../ui-enterprise";

export function ProjectProfitabilityTable({ data, isLoading }: { data: any[], isLoading: boolean }) {
  const columns: Column<any>[] = [
    {
      header: "Công trình",
      accessor: (row) => row.projectName,
      width: "25%"
    },
    {
      header: "Hợp đồng (Giá trị)",
      accessor: (row) => formatVnd(row.contractValue),
      align: "right",
      width: "15%"
    },
    {
      header: "Doanh thu hạch toán",
      accessor: (row) => formatVnd(row.revenue),
      align: "right",
      width: "15%"
    },
    {
      header: "Chi phí hạch toán",
      accessor: (row) => formatVnd(row.cost),
      align: "right",
      width: "15%"
    },
    {
      header: "Lãi/Lỗ",
      accessor: (row) => (
        <span className={row.profit < 0 ? "text-rose-600 font-semibold" : "text-emerald-600 font-semibold"}>
          {formatVnd(row.profit)}
        </span>
      ),
      align: "right",
      width: "15%"
    },
    {
      header: "Margin",
      accessor: (row) => `${row.profitMargin.toFixed(1)}%`,
      align: "center",
      width: "5%"
    },
    {
      header: "Trạng thái",
      accessor: (row) => (
        <EnterpriseBadge variant={row.riskLevel === "HIGH" ? "error" : row.riskLevel === "MEDIUM" ? "warning" : "success"}>
          {row.riskLevel}
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
