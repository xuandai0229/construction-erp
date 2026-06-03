"use client";

import React from "react";
import { formatVnd } from "../dashboard-data";
import { EnterpriseMetric } from "../ui-enterprise";
import { FinancialMetricKey } from "../accounting/FinancialDrilldownDrawer";

interface ExecutiveSummaryProps {
  data: {
    revenue?: number;
    cost?: number;
    profit?: number;
    receivables?: number;
    payables?: number;
    outstandingAdvances?: number;
    netCashflow?: number;
    pendingApprovals?: number;
  } | null;
  isLoading: boolean;
  onDrillDown: (metric: FinancialMetricKey, title: string, amount: number) => void;
  onNavigateApprovals?: () => void;
}

export function ExecutiveSummaryCards({ data, isLoading, onDrillDown, onNavigateApprovals }: ExecutiveSummaryProps) {
  const stats = {
    revenue: data?.revenue || 0,
    cost: data?.cost || 0,
    profit: data?.profit || 0,
    receivables: data?.receivables || 0,
    payables: data?.payables || 0,
    outstandingAdvances: data?.outstandingAdvances || 0,
    netCashflow: data?.netCashflow || 0,
    pendingApprovals: data?.pendingApprovals || 0
  };

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <EnterpriseMetric
        title="Tổng doanh thu hạch toán"
        value={formatVnd(stats.revenue)}
        description="Tổng giá trị doanh thu đã ghi sổ (TK 511)"
        isLoading={isLoading}
        onClick={() => onDrillDown("revenue", "Truy vết tổng doanh thu", stats.revenue)}
        trend={{ value: "Xem chi tiết", direction: "neutral" }}
        className="hover:shadow-md border-dashed"
      />
      <EnterpriseMetric
        title="Tổng chi phí sản xuất"
        value={formatVnd(stats.cost)}
        description="Tổng chi phí công trình phát sinh (TK 62*)"
        isLoading={isLoading}
        onClick={() => onDrillDown("cost", "Truy vết tổng chi phí", stats.cost)}
        trend={{ value: "Xem chi tiết", direction: "neutral" }}
        className="hover:shadow-md border-dashed"
      />
      <EnterpriseMetric
        title="Lợi nhuận gộp tạm tính"
        value={formatVnd(stats.profit)}
        description="Chênh lệch doanh thu - chi phí tạm tính"
        isLoading={isLoading}
        onClick={() => onDrillDown("profit", "Truy vết lãi/lỗ công trình", stats.profit)}
        trend={stats.profit >= 0 ? { value: "Xem chi tiết", direction: "up" } : { value: "Cần rà soát", direction: "down" }}
        className={stats.profit < 0 ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5"}
      />
      <EnterpriseMetric
        title="Dòng tiền thuần hằng tháng"
        value={formatVnd(stats.netCashflow)}
        description="Chênh lệch thu - chi tiền mặt/TGNH thực tế"
        isLoading={isLoading}
        onClick={() => onDrillDown("payments", "Truy vết thanh toán và dòng tiền", stats.netCashflow)}
        trend={stats.netCashflow >= 0 ? { value: "Xem chi tiết", direction: "up" } : { value: "Thâm hụt chi", direction: "down" }}
        className={stats.netCashflow < 0 ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5"}
      />

      <EnterpriseMetric
        title="Công nợ phải thu (AR)"
        value={formatVnd(stats.receivables)}
        description="Số dư phải thu chủ đầu tư (TK 131)"
        isLoading={isLoading}
        onClick={() => onDrillDown("receivables", "Truy vết công nợ phải thu", stats.receivables)}
        trend={{ value: "Xem chi tiết", direction: "neutral" }}
        className="hover:shadow-md border-dashed"
      />
      <EnterpriseMetric
        title="Công nợ phải trả (AP)"
        value={formatVnd(stats.payables)}
        description="Số dư phải trả thầu phụ/NCC (TK 331)"
        isLoading={isLoading}
        onClick={() => onDrillDown("payables", "Truy vết công nợ phải trả", stats.payables)}
        trend={{ value: "Xem chi tiết", direction: "neutral" }}
        className="hover:shadow-md border-dashed"
      />
      <EnterpriseMetric
        title="Tạm ứng công trình tồn đọng"
        value={formatVnd(stats.outstandingAdvances)}
        description="Tạm ứng nội bộ chưa hoàn ứng (TK 141)"
        isLoading={isLoading}
        onClick={() => onDrillDown("advances", "Truy vết tạm ứng/hoàn ứng", stats.outstandingAdvances)}
        trend={stats.outstandingAdvances > 100000000 ? { value: "Dư nợ cao", direction: "down" } : { value: "Xem chi tiết", direction: "neutral" }}
        className={stats.outstandingAdvances > 100000000 ? "border-amber-500/40 bg-amber-500/5 hover:shadow-md border-dashed" : "hover:shadow-md border-dashed"}
      />
      <EnterpriseMetric
        title="Chứng từ chờ phê duyệt"
        value={stats.pendingApprovals.toString()}
        description="Hồ sơ, hóa đơn đang xếp hàng chờ duyệt"
        isLoading={isLoading}
        onClick={onNavigateApprovals}
        trend={stats.pendingApprovals > 0 ? { value: "Cần xử lý", direction: "down" } : { value: "Đã sạch kiểm", direction: "neutral" }}
        className={stats.pendingApprovals > 0 ? "border-blue-500/40 bg-blue-500/5 hover:shadow-md border-dashed" : "hover:shadow-md border-dashed"}
      />
    </div>
  );
}
