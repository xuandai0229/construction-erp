"use client";

import React from "react";
import { formatVnd } from "../dashboard-data";
import { EnterpriseMetric } from "../ui-enterprise";

interface ExecutiveSummaryProps {
  data: any;
  isLoading: boolean;
  onDrillDown: (type: "invoice" | "advance" | "cost") => void;
  onNavigateApprovals?: () => void;
}

export function ExecutiveSummaryCards({ data, isLoading, onDrillDown, onNavigateApprovals }: ExecutiveSummaryProps) {
  const stats = data || {
    revenue: 0,
    cost: 0,
    profit: 0,
    receivables: 0,
    payables: 0,
    outstandingAdvances: 0,
    netCashflow: 0,
    pendingApprovals: 0
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <EnterpriseMetric
        title="Tổng doanh thu hạch toán"
        value={formatVnd(stats.revenue)}
        description="Tổng giá trị doanh thu đã ghi sổ (TK 511)"
        isLoading={isLoading}
        trend={{ value: "Doanh thu kỳ này", direction: "neutral" }}
      />
      <EnterpriseMetric
        title="Tổng chi phí sản xuất"
        value={formatVnd(stats.cost)}
        description="Tổng chi phí công trình phát sinh (TK 62*)"
        isLoading={isLoading}
        trend={{ value: "Chi phí phát sinh", direction: "neutral" }}
      />
      <EnterpriseMetric
        title="Lợi nhuận gộp tạm tính"
        value={formatVnd(stats.profit)}
        description="Chênh lệch Doanh thu - Chi phí tạm tính"
        isLoading={isLoading}
        trend={stats.profit >= 0 ? { value: "Tỷ suất dương", direction: "up" } : { value: "Cần rà soát", direction: "down" }}
        className={stats.profit < 0 ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5"}
      />
      <EnterpriseMetric
        title="Dòng tiền thuần hằng tháng"
        value={formatVnd(stats.netCashflow)}
        description="Chênh lệch Thu - Chi tiền mặt/TGNH thực tế"
        isLoading={isLoading}
        trend={stats.netCashflow >= 0 ? { value: "Thặng dư", direction: "up" } : { value: "Thâm hụt chi", direction: "down" }}
        className={stats.netCashflow < 0 ? "border-rose-500/40 bg-rose-500/5" : "border-emerald-500/40 bg-emerald-500/5"}
      />
      
      <EnterpriseMetric
        title="Công nợ phải thu (AR)"
        value={formatVnd(stats.receivables)}
        description="Số dư phải thu chủ đầu tư (TK 131)"
        isLoading={isLoading}
        onClick={() => onDrillDown("invoice")}
        trend={{ value: "Nhấp để truy vết", direction: "neutral" }}
        className="hover:shadow-md border-dashed"
      />
      <EnterpriseMetric
        title="Công nợ phải trả (AP)"
        value={formatVnd(stats.payables)}
        description="Số dư phải trả thầu phụ/NCC (TK 331)"
        isLoading={isLoading}
        onClick={() => onDrillDown("cost")}
        trend={{ value: "Nhấp để truy vết", direction: "neutral" }}
        className="hover:shadow-md border-dashed"
      />
      <EnterpriseMetric
        title="Tạm ứng công trình tồn đọng"
        value={formatVnd(stats.outstandingAdvances)}
        description="Tạm ứng nội bộ chưa hoàn ứng (TK 141)"
        isLoading={isLoading}
        onClick={() => onDrillDown("advance")}
        trend={stats.outstandingAdvances > 100000000 ? { value: "Dư nợ cao", direction: "down" } : { value: "An toàn", direction: "neutral" }}
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
