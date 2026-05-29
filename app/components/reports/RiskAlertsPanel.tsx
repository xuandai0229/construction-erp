"use client";

import React from "react";
import { formatVnd } from "../dashboard-data";
import { EnterpriseTable, Column, EnterpriseBadge, EnterpriseEmptyState } from "../ui-enterprise";
import { useRouter } from "next/navigation";

export function RiskAlertsPanel({ data, isLoading }: { data: any[], isLoading: boolean }) {
  const router = useRouter();

  const cols: Column<any>[] = [
    {
      header: "Mức độ",
      accessor: (row) => (
        <EnterpriseBadge variant={row.severity === "HIGH" ? "error" : row.severity === "MEDIUM" ? "warning" : "neutral"}>
          {row.severity}
        </EnterpriseBadge>
      ),
      width: "15%"
    },
    { header: "Phân hệ", accessor: (row) => row.module, width: "15%" },
    { header: "Mã chứng từ", accessor: (row) => row.documentNo, width: "20%" },
    { header: "Giá trị (VND)", accessor: (row) => formatVnd(row.amount), align: "right", width: "15%" },
    { header: "Nguyên nhân rủi ro", accessor: (row) => row.reason, width: "35%" }
  ];

  return (
    <EnterpriseTable
      data={data || []}
      columns={cols}
      loading={isLoading}
      onRowClick={(row) => {
        if (row.action) router.push(row.action);
      }}
      emptyState={<EnterpriseEmptyState title="Không có cảnh báo rủi ro" description="Hệ thống tài chính đang hoạt động ổn định trong biên độ an toàn." iconType="report" />}
    />
  );
}
