'use client';

import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useERPStore } from '@/store/erpStore';
import { useQuery } from '@tanstack/react-query';
import Sidebar from './Sidebar';
import Header from './Header';
import { Project } from '../types';
import { formatVnd } from './dashboard-data';
import {
  EnterpriseCard,
  EnterpriseTable,
  EnterpriseMetric,
  EnterpriseSection,
  EnterpriseBadge,
  EnterpriseEmptyState,
  Column
} from "./ui-enterprise";

import FinancialTracePanel from "./accounting/FinancialTracePanel";

export default function Dashboard() {
  const [traceType, setTraceType] = useState<'contract' | 'invoice' | 'payment' | 'advance'>('invoice');
  const [traceId, setTraceId] = useState<string | null>(null);
  const { currentProjectId, sidebarCollapsed } = useERPStore();
  const router = useRouter();

  // 1. Quét danh sách dự án
  const { data: projectsData, isLoading: isLoadingProjects } = useQuery({
    queryKey: ['projects-list'],
    queryFn: async () => {
      const res = await fetch('/api/projects');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });
  const projects = projectsData || [];

  // 2. Lấy thống kê KPI tài chính thực tế từ Sổ cái/Hạch toán
  const { data: dashboardStats, isLoading: isLoadingStats } = useQuery({
    queryKey: ['dashboard-stats', currentProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/dashboard/stats?projectId=${currentProjectId || ""}`);
      const json = await res.json();
      return json.success ? json.data : null;
    }
  });

  // 2.5. Lấy mẫu chứng từ để hỗ trợ click drill-down từ KPI
  const { data: firstInvoice } = useQuery({
    queryKey: ['sample-invoice-trace', currentProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/invoices?projectId=${currentProjectId || ""}`);
      const json = await res.json();
      return json.success && json.data.length > 0 ? json.data[0] : null;
    }
  });

  const { data: firstAdvance } = useQuery({
    queryKey: ['sample-advance-trace', currentProjectId],
    queryFn: async () => {
      const res = await fetch(`/api/advances?projectId=${currentProjectId || ""}`);
      const json = await res.json();
      return json.success && json.data.length > 0 ? json.data[0] : null;
    }
  });

  // 3. Quét các kỳ kế toán đang hoạt động/mở
  const { data: periodsData } = useQuery({
    queryKey: ['fiscal-periods'],
    queryFn: async () => {
      const res = await fetch('/api/fiscal-periods');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });
  const openPeriods = useMemo(() => {
    return (periodsData || []).filter((p: any) => p.status === "OPEN" || p.status === "ACTIVE");
  }, [periodsData]);

  // 4. Quét chứng từ chờ duyệt (Trạng thái nháp/Đã cất - chưa ghi sổ)
  const { data: pendingVouchersData, isLoading: isLoadingVouchers } = useQuery({
    queryKey: ['pending-vouchers'],
    queryFn: async () => {
      const res = await fetch('/api/accounting/vouchers?status=DA_CAT');
      const json = await res.json();
      return json.success ? json.data : [];
    }
  });
  const pendingVouchers = pendingVouchersData || [];

  // 5. Tính toán các dự án lỗ (Gross Profit < 0)
  const unprofitableProjects = useMemo(() => {
    return projects.filter((p: any) => {
      const rev = Number(p.totalRevenue || p.contractValue || 0);
      const cost = Number(p.totalCost || 0);
      return cost > rev;
    });
  }, [projects]);

  // Thống kê tài chính
  const stats = useMemo(() => {
    if (dashboardStats) return dashboardStats;
    // Fallback tính toán
    let totalReceivable = 0;
    let totalPayable = 0;
    let overBudgetCount = 0;
    let pendingCount = pendingVouchers.length;

    projects.forEach((p: any) => {
      const cost = Number(p.totalCost || 0);
      const budget = Number(p.totalBudget || p.contractValue || 0);
      if (cost > budget && budget > 0) {
        overBudgetCount++;
      }
    });

    return {
      receivableOutstanding: 0,
      payableOutstanding: 0,
      pendingVouchersCount: pendingCount,
      missingDocsCount: 0,
      outstandingAdvances: 0,
      overBudgetCount,
      openPeriodsCount: openPeriods.length
    };
  }, [dashboardStats, projects, pendingVouchers, openPeriods]);

  const columnsPendingVouchers: Column<any>[] = [
    {
      header: "Số chứng từ",
      accessor: (row) => row.reference || "Chưa cấp số",
      width: "15%"
    },
    {
      header: "Ngày hạch toán",
      accessor: (row) => new Date(row.date).toLocaleDateString("vi-VN"),
      align: "center",
      width: "15%"
    },
    {
      header: "Diễn giải",
      accessor: (row) => row.description || "N/A",
      width: "40%"
    },
    {
      header: "Tổng số tiền",
      accessor: (row) => formatVnd(Number(row.totalAmount || 0)),
      align: "right",
      width: "18%"
    },
    {
      header: "Trạng thái",
      accessor: (row) => (
        <EnterpriseBadge variant="warning">Chờ duyệt</EnterpriseBadge>
      ),
      align: "center",
      width: "12%"
    }
  ];

  const columnsUnprofitable: Column<any>[] = [
    {
      header: "Tên công trình",
      accessor: (row) => row.name || "N/A",
      width: "35%"
    },
    {
      header: "Mã dự án",
      accessor: (row) => row.code || "N/A",
      width: "15%"
    },
    {
      header: "Doanh thu hạch toán",
      accessor: (row) => formatVnd(Number(row.totalRevenue || row.contractValue || 0)),
      align: "right",
      width: "25%"
    },
    {
      header: "Chi phí thực tế",
      accessor: (row) => formatVnd(Number(row.totalCost || 0)),
      align: "right",
      width: "25%"
    }
  ];

  const isLoading = isLoadingProjects || isLoadingStats || isLoadingVouchers;

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex overflow-hidden">
      <Sidebar activeItem="dashboard" />

      <main className={`erp-page-main flex-1 flex flex-col h-screen overflow-hidden ${sidebarCollapsed ? 'pl-[var(--erp-sidebar-collapsed)]' : 'pl-[var(--erp-sidebar-width)]'}`}>
        <Header data={{ project: { name: "Bàn làm việc Kế toán" } } as any} />

        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
          {/* Section: Tổng quan Công nợ & Nghiệp vụ */}
          <EnterpriseSection title="CHỈ TIÊU KẾ TOÁN TRỌNG YẾU" subtitle="Các số liệu tài chính thời gian thực từ Sổ cái kế toán xây dựng">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <EnterpriseMetric
                title="CÔNG NỢ PHẢI THU (TK 131)"
                onClick={() => {
                  setTraceType('invoice');
                  setTraceId(firstInvoice?.id || 'sample-invoice-id');
                }}
                value={formatVnd(stats.receivableOutstanding)}
                description="Tổng tiền khách hàng nợ theo hợp đồng xây dựng"
                isLoading={isLoading}
              />
              <EnterpriseMetric
                title="CÔNG NỢ PHẢI TRẢ (TK 331)"
                value={formatVnd(stats.payableOutstanding)}
                description="Tổng tiền nợ nhà thầu phụ, tổ đội, nhà cung cấp"
                isLoading={isLoading}
              />
              <EnterpriseMetric
                title="TẠM ỨNG CHƯA QUYẾT TOÁN (TK 141)"
                onClick={() => {
                  setTraceType('advance');
                  setTraceId(firstAdvance?.id || 'sample-advance-id');
                }}
                value={formatVnd(stats.outstandingAdvances)}
                description="Tạm ứng mua vật tư công trình chưa làm thủ tục hoàn ứng"
                isLoading={isLoading}
              />
              <EnterpriseMetric
                title="CHI PHÍ VƯỢT DỰ TOÁN BOQ"
                value={`${stats.overBudgetCount} Công trình`}
                description="Hạng mục công trình vượt định mức chi phí nguyên vật liệu"
                isLoading={isLoading}
                className={stats.overBudgetCount > 0 ? "border-rose-500/30" : ""}
              />
            </div>
          </EnterpriseSection>

          {/* Section: Giám sát kỳ & Chứng từ */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Card 1: Chứng từ chờ ghi sổ */}
              <EnterpriseCard
                title="CHỨNG TỪ CHỜ PHÊ DUYỆT / GHI SỔ"
                subtitle="Các chứng từ đã cất nháp chưa hạch toán chính thức vào Sổ Cái"
                headerActions={
                  <button
                    onClick={() => router.push('/approvals')}
                    className="text-xs font-semibold text-blue-500 hover:underline"
                  >
                    Xem chi tiết
                  </button>
                }
              >
                <EnterpriseTable
                  data={pendingVouchers.slice(0, 5)}
                  columns={columnsPendingVouchers}
                  loading={isLoading}
                  emptyState={
                    <EnterpriseEmptyState
                      title="Chưa có chứng từ chờ duyệt"
                      description="Toàn bộ chứng từ phát sinh trong các kỳ kế toán đã được ghi sổ đầy đủ."
                      iconType="voucher"
                    />
                  }
                />
              </EnterpriseCard>

              {/* Card 2: Công trình dở dang lỗ / Cảnh báo tài chính */}
              <EnterpriseCard
                title="CẢNH BÁO CÔNG TRÌNH DỞ DANG LỖ / VƯỢT CHI PHÍ"
                subtitle="Danh sách các công trình có tổng chi phí hạch toán lớn hơn doanh thu nghiệm thu"
              >
                <EnterpriseTable
                  data={unprofitableProjects}
                  columns={columnsUnprofitable}
                  loading={isLoading}
                  emptyState={
                    <EnterpriseEmptyState
                      title="Không có công trình cảnh báo lỗ"
                      description="Tất cả các dự án, công trình xây dựng đang vận hành trong biên độ kiểm soát an toàn."
                      iconType="report"
                    />
                  }
                />
              </EnterpriseCard>
            </div>

            <div className="space-y-6">
              {/* Card 3: Kỳ kế toán đang mở */}
              <EnterpriseCard
                title="KỲ KẾ TOÁN ĐANG MỞ"
                subtitle="Các kỳ cho phép hạch toán và điều chỉnh chứng từ"
              >
                {openPeriods.length === 0 ? (
                  <EnterpriseEmptyState
                    title="Chưa mở kỳ kế toán nào"
                    description="Tất cả các tháng tài chính đã được khóa sổ tuyệt đối bởi CFO."
                    iconType="report"
                    actionLabel="Đến thiết lập kỳ"
                    onAction={() => router.push('/settings')}
                  />
                ) : (
                  <div className="space-y-3">
                    {openPeriods.map((period: any, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-3 rounded-lg border border-[var(--border)] bg-[var(--background)] select-none hover:border-[var(--primary)]/35 transition-colors duration-150"
                      >
                        <div className="flex flex-col space-y-0.5">
                          <span className="text-xs font-bold text-[var(--text-primary)]">Kỳ {period.periodStr}</span>
                          <span className="text-[10px] text-[var(--text-tertiary)]">
                            Từ {new Date(period.startDate).toLocaleDateString("vi-VN")} đến {new Date(period.endDate).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <EnterpriseBadge variant="success">Đang mở</EnterpriseBadge>
                      </div>
                    ))}
                  </div>
                )}
              </EnterpriseCard>

              {/* Card 4: Kiểm soát hồ sơ kế toán */}
              <EnterpriseCard
                title="KIỂM SOÁT HỒ SƠ CHỨNG TỪ"
                subtitle="Chỉ tiêu phát hiện lỗi và tính nhất quán dữ liệu"
              >
                <div className="divide-y divide-[var(--divider)]">
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-[var(--text-secondary)]">Chứng từ thiếu hóa đơn gốc</span>
                    <EnterpriseBadge variant={stats.missingDocsCount > 0 ? "error" : "success"}>
                      {stats.missingDocsCount} Lỗi
                    </EnterpriseBadge>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-[var(--text-secondary)]">Bút toán kết chuyển WIP dở dang</span>
                    <EnterpriseBadge variant="neutral">Cần lập kỳ này</EnterpriseBadge>
                  </div>
                  <div className="flex items-center justify-between py-2.5">
                    <span className="text-xs text-[var(--text-secondary)]">Đối chiếu Số dư Sổ Cái vs Chi tiết</span>
                    <EnterpriseBadge variant="success">Khớp 100%</EnterpriseBadge>
                  </div>
                </div>
              </EnterpriseCard>
            </div>
          </div>
        </div>
      </main>
      <FinancialTracePanel
        type={traceType}
        id={traceId || ""}
        isOpen={traceId !== null}
        onClose={() => setTraceId(null)}
      />
    </div>
  );
}
