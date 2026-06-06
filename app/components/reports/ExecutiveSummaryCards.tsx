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
    profit: data?.profit ?? (data?.revenue || 0) - (data?.cost || 0),
    receivables: data?.receivables || 0,
    payables: data?.payables || 0,
    outstandingAdvances: data?.outstandingAdvances || 0,
    netCashflow: data?.netCashflow || 0,
    pendingApprovals: data?.pendingApprovals || 0,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-sky-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M17 5H9.5a3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> Tổng doanh thu hạch toán</>}
          value={formatVnd(stats.revenue)}
          description="Doanh thu đã được phê duyệt và ghi nhận trong kỳ."
          isLoading={isLoading}
          onClick={() => onDrillDown("revenue", "Chi tiết doanh thu hạch toán", stats.revenue)}
          trend={{ value: "Xem chi tiết →", direction: "neutral" }}
          className="border-l-4 border-l-sky-500 bg-gradient-to-br from-sky-500/10 to-transparent hover:shadow-sky-500/10"
        />
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg> Tổng chi phí sản xuất</>}
          value={formatVnd(stats.cost)}
          description="Chi phí sản xuất đã được tập hợp và phê duyệt theo công trình."
          isLoading={isLoading}
          onClick={() => onDrillDown("cost", "Chi tiết chi phí sản xuất", stats.cost)}
          trend={{ value: "Xem chi tiết →", direction: "neutral" }}
          className="border-l-4 border-l-indigo-500 bg-gradient-to-br from-indigo-500/10 to-transparent hover:shadow-indigo-500/10"
        />
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-emerald-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> Lợi nhuận gộp tạm tính</>}
          value={formatVnd(stats.profit)}
          description="Doanh thu hạch toán trừ đi chi phí sản xuất trực tiếp."
          isLoading={isLoading}
          onClick={() => onDrillDown("profit", "Chi tiết lợi nhuận gộp tạm tính", stats.profit)}
          trend={stats.profit >= 0 ? { value: "Tích cực", direction: "up" } : { value: "Cần rà soát", direction: "down" }}
          className={stats.profit < 0 ? "border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-500/10 to-transparent hover:shadow-rose-500/10" : "border-l-4 border-l-emerald-500 bg-gradient-to-br from-emerald-500/10 to-transparent hover:shadow-emerald-500/10"}
        />
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-cyan-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12V7H5a2 2 0 010-4h14v4M3 15v4a2 2 0 002 2h16v-4H3z" /></svg> Dòng tiền thuần kỳ này</>}
          value={formatVnd(stats.netCashflow)}
          description="Lượng tiền thu vào trừ đi lượng tiền chi ra thực tế."
          isLoading={isLoading}
          onClick={() => onDrillDown("payments", "Chi tiết dòng tiền thuần", stats.netCashflow)}
          trend={stats.netCashflow >= 0 ? { value: "Dương", direction: "up" } : { value: "Âm", direction: "down" }}
          className={stats.netCashflow < 0 ? "border-l-4 border-l-rose-500 bg-gradient-to-br from-rose-500/10 to-transparent hover:shadow-rose-500/10" : "border-l-4 border-l-cyan-500 bg-gradient-to-br from-cyan-500/10 to-transparent hover:shadow-cyan-500/10"}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-orange-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> Công nợ phải thu (AR)</>}
          value={formatVnd(stats.receivables)}
          description="Số tiền còn phải thu từ khách hàng hoặc chủ đầu tư."
          isLoading={isLoading}
          onClick={() => onDrillDown("receivables", "Chi tiết công nợ phải thu", stats.receivables)}
          trend={{ value: "Phân tích công nợ", direction: "neutral" }}
        />
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-rose-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 3h18v18H3zM9 9h6M9 15h6M12 9v6" /></svg> Công nợ phải trả (AP)</>}
          value={formatVnd(stats.payables)}
          description="Số tiền còn nợ nhà cung cấp, thầu phụ chưa thanh toán."
          isLoading={isLoading}
          onClick={() => onDrillDown("payables", "Chi tiết công nợ phải trả", stats.payables)}
          trend={{ value: "Phân tích công nợ", direction: "neutral" }}
        />
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-amber-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg> Tạm ứng công trình tồn đọng</>}
          value={formatVnd(stats.outstandingAdvances)}
          description="Tiền tạm ứng đã được phê duyệt nhưng chưa thực hiện hoàn ứng."
          isLoading={isLoading}
          onClick={() => onDrillDown("advances", "Chi tiết tạm ứng công trình", stats.outstandingAdvances)}
          trend={stats.outstandingAdvances > 100000000 ? { value: "Ưu tiên xử lý", direction: "down" } : { value: "Tra cứu thêm", direction: "neutral" }}
          className={stats.outstandingAdvances > 100000000 ? "border-amber-500/40 bg-amber-500/5" : ""}
        />
        <EnterpriseMetric
          title={<><svg viewBox="0 0 24 24" className="h-4 w-4 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Chứng từ chờ phê duyệt</>}
          value={stats.pendingApprovals.toLocaleString("vi-VN")}
          description="Hồ sơ kế toán đang chờ bạn duyệt hoặc cần xử lý trong ngày."
          isLoading={isLoading}
          onClick={onNavigateApprovals}
          trend={stats.pendingApprovals > 0 ? { value: "Cần xử lý ngay", direction: "down" } : { value: "Không tồn đọng", direction: "neutral" }}
          className={stats.pendingApprovals > 0 ? "border-blue-500/40 bg-blue-500/5" : ""}
        />
      </div>
    </div>
  );
}
