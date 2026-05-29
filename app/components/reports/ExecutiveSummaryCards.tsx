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
        title="TỔNG DOANH THU"
        value={formatVnd(stats.revenue)}
        description="Tổng giá trị doanh thu đã ghi nhận (TK 511)"
        isLoading={isLoading}
      />
      <EnterpriseMetric
        title="TỔNG CHI PHÍ"
        value={formatVnd(stats.cost)}
        description="Tổng giá trị chi phí công trình (TK 621, 622, 627)"
        isLoading={isLoading}
      />
      <EnterpriseMetric
        title="LÃI / LỖ TẠM TÍNH"
        value={formatVnd(stats.profit)}
        description="Lợi nhuận gộp từ các dự án"
        isLoading={isLoading}
        className={stats.profit < 0 ? "border-rose-500/30" : "border-emerald-500/30"}
      />
      <EnterpriseMetric
        title="DÒNG TIỀN THUẦN (NET CASHFLOW)"
        value={formatVnd(stats.netCashflow)}
        description="Chênh lệch Thu - Chi tiền mặt/TGNH"
        isLoading={isLoading}
        className={stats.netCashflow < 0 ? "border-rose-500/30" : "border-emerald-500/30"}
      />
      
      <EnterpriseMetric
        title="CÔNG NỢ PHẢI THU (AR)"
        value={formatVnd(stats.receivables)}
        description="Công nợ khách hàng chưa thanh toán"
        isLoading={isLoading}
        onClick={() => onDrillDown("invoice")}
      />
      <EnterpriseMetric
        title="CÔNG NỢ PHẢI TRẢ (AP)"
        value={formatVnd(stats.payables)}
        description="Công nợ phải trả nhà thầu/nhà cung cấp"
        isLoading={isLoading}
        onClick={() => onDrillDown("cost")}
      />
      <EnterpriseMetric
        title="TẠM ỨNG TỒN ĐỌNG"
        value={formatVnd(stats.outstandingAdvances)}
        description="Tạm ứng nội bộ chưa quyết toán hoàn ứng"
        isLoading={isLoading}
        onClick={() => onDrillDown("advance")}
        className={stats.outstandingAdvances > 100000000 ? "border-amber-500/30" : ""}
      />
      <EnterpriseMetric
        title="CHỨNG TỪ CHỜ DUYỆT"
        value={stats.pendingApprovals.toString()}
        description="Số lượng chứng từ đang chờ phê duyệt"
        isLoading={isLoading}
        onClick={onNavigateApprovals}
      />
    </div>
  );
}
