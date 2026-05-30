'use client';

import { useState, useEffect, useMemo } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { COL_WIDTHS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';
import { 
  EnterpriseCard,
  EnterpriseTable,
  EnterpriseSection,
  EnterpriseMetric,
  EnterpriseBadge,
  EnterpriseEmptyState,
  Select,
  Column,
  EnterpriseModal
} from '@/app/components/ui-enterprise';

import { 
  useMonthlyReportQuery, 
  useAgingReportQuery,
  useFiscalPeriodsQuery,
  useToggleFiscalPeriodMutation
} from '@/services/queries/useReports';
import { MonthlyReportRow } from '@/app/types/financial';

type ReportTab = 'cash_aging' | 'trial_balance' | 'balance_sheet' | 'vat_summary';

export default function ReportsPage() {
  const currentProjectId  = useERPStore(state => state.currentProjectId);
  const { data: paginatedData } = useProjectsQuery();
  const projects = paginatedData?.data || [];
  const setCurrentProject = useERPStore(state => state.setCurrentProject);
  const sidebarCollapsed  = useERPStore(state => state.sidebarCollapsed);

  // Tab state
  const [activeTab, setActiveTab] = useState<ReportTab>('cash_aging');
  const [financialData, setFinancialData] = useState<any>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);

  // Drill-down state
  const [drillAccount, setDrillAccount] = useState<any>(null);
  const [drillLines, setDrillLines] = useState<any[]>([]);
  const [drillPage, setDrillPage] = useState(1);
  const [drillTotalPages, setDrillTotalPages] = useState(1);
  const [loadingDrill, setLoadingDrill] = useState(false);

  // Classic queries
  const { data: monthlyData = [], isLoading: loadingMonthly } = useMonthlyReportQuery(currentProjectId);
  const { data: arAging = [] } = useAgingReportQuery(currentProjectId, 'receivable');
  const { data: apAging = [] } = useAgingReportQuery(currentProjectId, 'payable');
  const { data: locks = [] } = useFiscalPeriodsQuery();
  const toggleLockMutation = useToggleFiscalPeriodMutation();

  const toggleLock = (month: string) => {
    toggleLockMutation.mutate(month);
  };

  // Fetch dynamic authoritative accounting reports
  useEffect(() => {
    if (currentProjectId) {
      setLoadingFinancial(true);
      fetch(`/api/reports/financial?projectId=${currentProjectId}`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setFinancialData(res.data);
          }
        })
        .catch(err => console.error("Failed to load accounting reports", err))
        .finally(() => setLoadingFinancial(false));
    }
  }, [currentProjectId]);

  // Fetch ledger lines for granular CFO drill-down
  useEffect(() => {
    if (drillAccount && currentProjectId) {
      setLoadingDrill(true);
      fetch(`/api/reports/ledger-lines?projectId=${currentProjectId}&accountCode=${drillAccount.code}&page=${drillPage}&limit=10`)
        .then(res => res.json())
        .then(res => {
          if (res.success) {
            setDrillLines(res.data.lines);
            setDrillTotalPages(res.data.pagination.totalPages);
          }
        })
        .catch(err => console.error("Failed to load ledger lines", err))
        .finally(() => setLoadingDrill(false));
    }
  }, [drillAccount, drillPage, currentProjectId]);

  const agingCats = ['0-30 days', '31-60 days', '61-90 days', '90+ days'];
  
  const agingLabels: Record<string, string> = {
    '0-30 days': '0 - 30 ngày',
    '31-60 days': '31 - 60 ngày',
    '61-90 days': '61 - 90 ngày',
    '90+ days': 'Trên 90 ngày',
  };

  const handleExport = () => {
    const project = projects.find(p => p.id === currentProjectId);
    const dateStr = new Date().toISOString().split('T')[0];
    
    fetch("/api/monitoring/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CSV" })
    }).catch(() => {});

    fetch("/api/reports/audit-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType: `EXPORT_${activeTab.toUpperCase()}`, projectId: currentProjectId })
    }).catch(() => {});

    if (activeTab === 'cash_aging') {
      const filename = `BC_DongTien_${project?.name || 'DuAn'}_${dateStr}.csv`;
      exportToCsv(filename, monthlyData);
    } else if (activeTab === 'trial_balance') {
      const filename = `BC_CanDoiPhatSinh_${project?.name || 'DuAn'}_${dateStr}.csv`;
      exportToCsv(filename, financialData?.trialBalance || []);
    } else if (activeTab === 'balance_sheet') {
      const filename = `BC_CanDoiKeToan_${project?.name || 'DuAn'}_${dateStr}.csv`;
      const data = [
        ...financialData?.balanceSheet.assets.map((a: any) => ({ ...a, section: 'TAI_SAN' })),
        ...financialData?.balanceSheet.liabilities.map((l: any) => ({ ...l, section: 'NO_PHAI_TRA' })),
        ...financialData?.balanceSheet.equity.map((e: any) => ({ ...e, section: 'VON_CHU_SOHUU' }))
      ];
      exportToCsv(filename, data);
    } else if (activeTab === 'vat_summary') {
      const filename = `ToKhaiThueVAT_${project?.name || 'DuAn'}_${dateStr}.csv`;
      exportToCsv(filename, financialData?.vatSummary || []);
    }
  };

  const handlePrint = () => {
    fetch("/api/monitoring/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PDF" })
    }).catch(() => {});

    fetch("/api/reports/audit-export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportType: `PRINT_${activeTab.toUpperCase()}`, projectId: currentProjectId })
    }).catch(() => {});

    window.print();
  };

  // 1. Column Definitions: Dòng tiền & Công nợ
  const columnsMonthly: Column<MonthlyReportRow>[] = [
    {
      header: "Tháng",
      accessor: (row) => {
        const locked = locks.includes(row.month);
        return (
          <div className="flex items-center gap-2 font-bold tabular-nums">
            {locked && (
              <svg viewBox="0 0 24 24" className="h-3 w-3 text-rose-500 shrink-0" fill="currentColor">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
              </svg>
            )}
            {row.month}
          </div>
        );
      },
      align: "center",
      width: "130px"
    },
    {
      header: "Tổng Thu (Cash In)",
      accessor: (row) => <span className="text-emerald-500 font-semibold">{formatVnd(row.cashIn)}</span>,
      align: "right",
      width: "170px"
    },
    {
      header: "Tổng Chi (Cash Out)",
      accessor: (row) => <span className="text-rose-500 font-semibold">{formatVnd(row.cashOut)}</span>,
      align: "right",
      width: "170px"
    },
    {
      header: ERP_TERMINOLOGY.FINANCE.REVENUE,
      accessor: (row) => formatVnd(row.revenue),
      align: "right",
      width: "180px"
    },
    {
      header: "Chi Phí Sổ Sách",
      accessor: (row) => formatVnd(row.cost),
      align: "right",
      width: "160px"
    },
    {
      header: "Lợi Nhuận Thuần",
      accessor: (row) => (
        <span className={row.profit >= 0 ? 'text-emerald-500 font-bold' : 'text-rose-500 font-bold'}>
          {row.profit >= 0 ? '+' : ''}{formatVnd(row.profit)}
        </span>
      ),
      align: "right",
      width: "170px"
    },
    {
      header: "Số Dư Lũy Kế",
      accessor: (row) => (
        <span className={row.runningBalance >= 0 ? 'text-blue-500 font-black' : 'text-rose-500 font-black'}>
          {formatVnd(row.runningBalance)}
        </span>
      ),
      align: "right",
      width: "160px"
    },
    {
      header: "Khóa Sổ",
      accessor: (row) => {
        const locked = locks.includes(row.month);
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLock(row.month);
            }}
            className={`h-7 px-3 text-[10px] font-bold rounded-[var(--radius-sm)] border transition-all duration-150 cursor-pointer ${
              locked
                ? 'bg-rose-500/10 text-rose-500 border-rose-500/20 hover:bg-rose-500/20'
                : 'bg-[var(--card)] text-[var(--text-secondary)] border-[var(--border)] hover:bg-[var(--muted)]'
            }`}
          >
            {locked ? 'Mở khóa' : 'Khóa sổ'}
          </button>
        );
      },
      align: "center",
      width: "120px"
    }
  ];

  // 2. Column Definitions: Bảng cân đối phát sinh
  const columnsTrialBalance: Column<any>[] = [
    {
      header: "Mã TK",
      accessor: (row) => (
        <div className="flex items-center justify-center gap-1.5 font-bold text-violet-400 group-hover:text-violet-300">
          {row.code}
          <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 opacity-20 group-hover:opacity-100 transition-opacity text-violet-400" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M2.062 12.348a1 1 0 0 1 0-.696 10.75 10.75 0 0 1 19.876 0 1 1 0 0 1 0 .696 10.75 10.75 0 0 1-19.876 0z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
      ),
      align: "center",
      width: "15%",
      minWidth: "90px"
    },
    {
      header: "Tên Tài Khoản Sổ Cái",
      accessor: (row) => row.name,
      width: "40%",
      minWidth: "220px"
    },
    {
      header: "Loại TK",
      accessor: (row) => <span className="text-[10px] font-black uppercase text-violet-400">{row.type}</span>,
      align: "center",
      width: "12%",
      minWidth: "90px"
    },
    {
      header: "Phát Sinh Nợ (Debit)",
      accessor: (row) => <span className="text-emerald-500 font-semibold">{formatVnd(row.debitSum)}</span>,
      align: "right",
      width: "16%",
      minWidth: "150px"
    },
    {
      header: "Phát Sinh Có (Credit)",
      accessor: (row) => <span className="text-rose-500 font-semibold">{formatVnd(row.creditSum)}</span>,
      align: "right",
      width: "16%",
      minWidth: "150px"
    },
    {
      header: "Dư Cuối Kỳ (Balance)",
      accessor: (row) => <span className="text-blue-500 font-extrabold">{formatVnd(row.balance)}</span>,
      align: "right",
      width: "16%",
      minWidth: "160px"
    }
  ];

  // 3. Column Definitions: VAT Summary
  const columnsVat: Column<any>[] = [
    {
      header: "Ngày",
      accessor: (row) => new Date(row.date).toLocaleDateString('vi-VN'),
      align: "center",
      width: "12%"
    },
    {
      header: "Nhà cung cấp / Đối tác",
      accessor: (row) => row.supplier,
      width: "240px"
    },
    {
      header: "Nội dung chi tiết chứng từ",
      accessor: (row) => row.note || "N/A",
      width: "320px"
    },
    {
      header: "Giá chưa thuế (Net)",
      accessor: (row) => formatVnd(row.netAmount),
      align: "right",
      width: "170px"
    },
    {
      header: "Thuế suất",
      accessor: (row) => `${row.vatRate}%`,
      align: "center",
      width: "110px"
    },
    {
      header: "Tiền thuế VAT",
      accessor: (row) => <span className="text-rose-500 font-semibold">{formatVnd(row.vatAmount)}</span>,
      align: "right",
      width: "160px"
    },
    {
      header: "Tổng thanh toán",
      accessor: (row) => <span className="text-blue-500 font-extrabold">{formatVnd(row.amount)}</span>,
      align: "right",
      width: "180px"
    }
  ];
  return (
    <EnterpriseAppShell activeItem="reports">
      <EnterprisePageContainer>
        <div className="space-y-6 print:p-0 print:overflow-visible print:h-auto">
          {/* Page Header (Hidden in Print mode) */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between select-none pb-4 border-b border-[var(--border)] print:hidden">
            <div>
              <h1 className="text-base font-bold tracking-tight text-[var(--text-primary)]">Hệ thống Báo cáo Kế toán & Tài chính</h1>
              <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">Tổng hợp sổ cái động cấp kế toán và quản trị thuế doanh nghiệp</p>
            </div>

            <div className="flex items-center gap-2 mt-4 sm:mt-0">
              <Select
                value={currentProjectId}
                onChange={e => setCurrentProject(e.target.value)}
                className="min-w-64 font-bold"
              >
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </Select>

              <button
                onClick={handlePrint}
                className="h-[38px] px-4 text-xs font-semibold text-white bg-[var(--primary)] hover:bg-[var(--primary)]/90 rounded-[var(--radius-sm)] flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="6 9 6 2 18 2 18 9" />
                  <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                  <rect x="6" y="14" width="12" height="8" />
                </svg>
                In báo cáo (PDF)
              </button>

              <button
                onClick={handleExport}
                className="h-[38px] px-4 text-xs font-semibold text-[var(--text-primary)] border border-[var(--border)] bg-[var(--card)] hover:bg-[var(--muted)] rounded-[var(--radius-sm)] flex items-center gap-1.5 transition-colors duration-150 cursor-pointer shadow-sm"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                </svg>
                Xuất Excel/CSV
              </button>
            </div>
          </div>

          {/* Dynamic Tab Switcher (Hidden in Print Mode) */}
          <div className="flex border-b border-[var(--border)] gap-2 print:hidden overflow-x-auto scrollbar-hide select-none">
            {[
              { id: 'cash_aging', label: 'Dòng tiền & Công nợ' },
              { id: 'trial_balance', label: 'Bảng Cân đối Phát sinh' },
              { id: 'balance_sheet', label: 'Bảng Cân đối Kế toán' },
              { id: 'vat_summary', label: 'Báo cáo Thuế VAT' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`py-2 px-4 font-bold text-xs uppercase tracking-wider transition-all border-b-2 -mb-0.5 whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-[var(--primary)] text-[var(--primary)] font-extrabold'
                    : 'border-transparent text-[var(--text-tertiary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Print Mode Header */}
          <div className="hidden print:block text-center space-y-2 border-b-2 border-zinc-800 pb-4">
            <h2 className="text-xl font-bold uppercase tracking-wider text-black">BÁO CÁO TÀI CHÍNH DOANH NGHIỆP THỜI GIAN THỰC</h2>
            <p className="text-[12px] text-zinc-600">Dự án: {projects.find(p => p.id === currentProjectId)?.name || currentProjectId}</p>
            <p className="text-[10px] text-zinc-500">Thời gian lập: {new Date().toLocaleString('vi-VN')}</p>
          </div>

          {/* TAB CONTENT 1: CASH FLOW & AGING */}
          {activeTab === 'cash_aging' && (
            <div className="space-y-6">
              {/* Monthly P&L table */}
              <EnterpriseCard
                title="KẾT QUẢ HOẠT ĐỘNG KINH DOANH (P&L) THEO THÁNG"
                subtitle="Dòng tiền mặt thu chi và kết quả sản xuất kinh doanh dở dang hạch toán"
                headerActions={
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider print:hidden">
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    Tháng đỏ: Kỳ hạch toán đã khóa
                  </div>
                }
              >
                <EnterpriseTable
                  data={monthlyData}
                  columns={columnsMonthly}
                  loading={loadingMonthly}
                  emptyState={
                    <EnterpriseEmptyState
                      title="Chưa có dữ liệu phát sinh"
                      description="Hệ thống chưa ghi nhận dòng tiền hay doanh thu hạch toán nào của dự án trong kỳ này."
                      iconType="report"
                    />
                  }
                />
              </EnterpriseCard>

              {/* Aging Debt Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                
                <EnterpriseCard
                  title="PHÂN TÍCH TUỔI NỢ PHẢI THU (A/R AGING)"
                  subtitle="Công nợ chủ đầu tư quá hạn thanh toán"
                >
                  <div className="space-y-3">
                    {agingCats.map(cat => {
                      const bucket = arAging.find((b: any) => b.bucket === cat);
                      const total = bucket?.amount || 0;
                      const count = bucket?.count || 0;
                      return (
                        <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] select-none hover:border-[var(--primary)]/35 transition-colors">
                          <div>
                            <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{agingLabels[cat] || cat}</div>
                            <div className="text-xs font-black text-[var(--text-primary)] tabular-nums mt-0.5">{formatVnd(total)}</div>
                          </div>
                          <EnterpriseBadge variant="neutral">{count} khoản nợ</EnterpriseBadge>
                        </div>
                      );
                    })}
                  </div>
                </EnterpriseCard>

                <EnterpriseCard
                  title="PHÂN TÍCH TUỔI NỢ PHẢI TRẢ (A/P AGING)"
                  subtitle="Công nợ tổ đội, nhà thầu phụ quá hạn thanh toán"
                >
                  <div className="space-y-3">
                    {agingCats.map(cat => {
                      const bucket = apAging.find((b: any) => b.bucket === cat);
                      const total = bucket?.amount || 0;
                      const count = bucket?.count || 0;
                      return (
                        <div key={cat} className="flex items-center justify-between p-3 rounded-lg bg-[var(--background)] border border-[var(--border)] select-none hover:border-[var(--primary)]/35 transition-colors">
                          <div>
                            <div className="text-[9px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">{agingLabels[cat] || cat}</div>
                            <div className="text-xs font-black text-[var(--text-primary)] tabular-nums mt-0.5">{formatVnd(total)}</div>
                          </div>
                          <EnterpriseBadge variant="neutral">{count} khoản nợ</EnterpriseBadge>
                        </div>
                      );
                    })}
                  </div>
                </EnterpriseCard>

              </div>
            </div>
          )}

          {/* TAB CONTENT 2: TRIAL BALANCE */}
          {activeTab === 'trial_balance' && (
            <EnterpriseCard
              title="BẢNG CÂN ĐỐI PHÁT SINH TÀI KHOẢN (TRIAL BALANCE)"
              subtitle="Cân đối đối soát kép toàn bộ Sổ cái tài khoản kế toán công trình Thông tư 200"
              headerActions={
                <div className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider print:hidden">
                  ĐốI SOÁT: TỔNG NỢ (DEBIT) = TỔNG CÓ (CREDIT)
                </div>
              }
            >
              <EnterpriseTable
                data={financialData?.trialBalance || []}
                columns={columnsTrialBalance}
                loading={loadingFinancial}
                onRowClick={(row) => {
                  setDrillAccount({ code: row.code, name: row.name });
                  setDrillPage(1);
                }}
                emptyState={
                  <EnterpriseEmptyState
                    title="Chưa tổng hợp được Sổ Cái"
                    description="Vui lòng thực hiện kiểm tra các bút toán hoặc mở kỳ hạch toán để tạo sổ phát sinh."
                    iconType="report"
                  />
                }
              />

              {financialData?.trialBalance?.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] flex flex-wrap justify-between items-center select-none font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                  <span>TỔNG CỘNG ĐỐI SOÁT LEDGER</span>
                  <div className="flex gap-8">
                    <div>NỢ: <span className="text-emerald-500 font-black tabular-nums">{formatVnd(financialData.trialBalance.reduce((s: number, r: any) => s + r.debitSum, 0))}</span></div>
                    <div>CÓ: <span className="text-rose-500 font-black tabular-nums">{formatVnd(financialData.trialBalance.reduce((s: number, r: any) => s + r.creditSum, 0))}</span></div>
                    <div>CÂN ĐỐI: <span className="text-blue-500 font-black tabular-nums">{formatVnd(financialData.trialBalance.reduce((s: number, r: any) => s + Math.abs(r.balance), 0) / 2)}</span></div>
                  </div>
                </div>
              )}
            </EnterpriseCard>
          )}

          {/* TAB CONTENT 3: BALANCE SHEET */}
          {activeTab === 'balance_sheet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
              
              {/* ASSETS */}
              <EnterpriseCard
                title="PHẦN I: TÀI SẢN (ASSETS)"
                subtitle="Tổng hợp các chỉ tiêu tài sản dở dang và tiền gửi"
              >
                <EnterpriseTable
                  data={financialData?.balanceSheet.assets || []}
                  columns={[
                    { header: 'Chỉ tiêu tài sản', accessor: (row: any) => row.name, width: '50%' },
                    { header: 'Mã TK', accessor: (row: any) => <span className="font-bold text-violet-400">{row.code}</span>, align: 'center', width: '120px' },
                    { header: 'Số dư cuối kỳ', accessor: (row: any) => <span className="font-bold text-blue-500">{formatVnd(row.balance)}</span>, align: 'right', width: '180px' },
                  ]}
                  minWidth="720px"
                  getRowKey={(row: any) => row.code}
                  emptyState={<EnterpriseEmptyState title="Chưa có báo cáo tài sản" description="Chưa có số dư tài sản để lập bảng cân đối kế toán." iconType="report" />}
                  footer={
                    <tr className="h-[40px] text-[12px] font-bold">
                      <td className="px-4 text-left uppercase text-emerald-500">Tổng cộng tài sản</td>
                      <td className="px-4 text-center">-</td>
                      <td className="px-4 text-right font-mono tabular-nums text-emerald-500">{formatVnd(financialData?.balanceSheet.assets.reduce((s: number, r: any) => s + r.balance, 0) || 0)}</td>
                    </tr>
                  }
                />
              </EnterpriseCard>

              {/* LIABILITIES & EQUITIES */}
              <EnterpriseCard
                title="PHẦN II: NGUỒN VỐN & PHẢI TRẢ"
                subtitle="Cơ cấu nợ phải trả nhà thầu phụ và vốn chủ sở hữu"
              >
                <EnterpriseTable
                  data={[
                    ...(financialData?.balanceSheet.liabilities || []).map((row: any) => ({ ...row, section: 'Nợ phải trả', tone: 'rose' })),
                    ...(financialData?.balanceSheet.equity || []).map((row: any) => ({ ...row, section: 'Vốn chủ sở hữu', tone: 'blue' })),
                  ]}
                  columns={[
                    { header: 'Chỉ tiêu nguồn vốn', accessor: (row: any) => `${row.section} - ${row.name}`, width: '50%' },
                    { header: 'Mã TK', accessor: (row: any) => <span className="font-bold text-violet-400">{row.code}</span>, align: 'center', width: '120px' },
                    { header: 'Số dư cuối kỳ', accessor: (row: any) => <span className={row.tone === 'rose' ? 'font-bold text-rose-500' : 'font-bold text-blue-500'}>{formatVnd(row.balance)}</span>, align: 'right', width: '180px' },
                  ]}
                  minWidth="720px"
                  getRowKey={(row: any) => `${row.section}-${row.code}`}
                  emptyState={<EnterpriseEmptyState title="Chưa có báo cáo nguồn vốn" description="Chưa có số dư nợ phải trả hoặc vốn chủ sở hữu." iconType="report" />}
                  footer={
                    <tr className="h-[40px] text-[12px] font-bold">
                      <td className="px-4 text-left uppercase text-rose-500">Tổng cộng nguồn vốn</td>
                      <td className="px-4 text-center">-</td>
                      <td className="px-4 text-right font-mono tabular-nums text-rose-500">{formatVnd((financialData?.balanceSheet.liabilities.reduce((s: number, r: any) => s + r.balance, 0) || 0) + (financialData?.balanceSheet.equity.reduce((s: number, r: any) => s + r.balance, 0) || 0))}</td>
                    </tr>
                  }
                />
              </EnterpriseCard>

            </div>
          )}

          {/* TAB CONTENT 4: VAT SUMMARY */}
          {activeTab === 'vat_summary' && (
            <EnterpriseCard
              title="BÁO CÁO TỔNG HỢP THUẾ GTGT ĐẦU VÀO (VAT SUMMARY)"
              subtitle="Danh sách các hóa đơn VAT chi phí, vật tư mua vào phục vụ công trình"
              headerActions={
                <div className="text-[10px] text-[var(--text-tertiary)] font-semibold uppercase tracking-wider print:hidden">
                  ĐỐI CHIẾU THỜI GIAN THỰC SỔ SÁCH
                </div>
              }
            >
              <EnterpriseTable
                data={financialData?.vatSummary || []}
                columns={columnsVat}
                loading={loadingFinancial}
                emptyState={
                  <EnterpriseEmptyState
                    title="Chưa kê khai thuế VAT đầu vào"
                    description="Không có hóa đơn giá trị gia tăng nào phát sinh hoặc được ghi nhận trong kỳ báo cáo này."
                    iconType="report"
                  />
                }
              />

              {financialData?.vatSummary?.length > 0 && (
                <div className="mt-4 p-4 rounded-lg bg-[var(--background)] border border-[var(--border)] flex flex-wrap justify-between items-center select-none font-bold text-xs uppercase tracking-wider text-[var(--text-primary)]">
                  <span>TỔNG KÊ KHAI THUẾ GTGT ĐẦU VÀO</span>
                  <div className="flex gap-8">
                    <div>CHƯA THUẾ (NET): <span className="text-[var(--text-primary)] font-black tabular-nums">{formatVnd(financialData.vatSummary.reduce((s: number, r: any) => s + r.netAmount, 0))}</span></div>
                    <div>TIỀN THUẾ: <span className="text-rose-500 font-black tabular-nums">{formatVnd(financialData.vatSummary.reduce((s: number, r: any) => s + r.vatAmount, 0))}</span></div>
                    <div>TỔNG THANH TOÁN: <span className="text-blue-500 font-black tabular-nums">{formatVnd(financialData.vatSummary.reduce((s: number, r: any) => s + r.amount, 0))}</span></div>
                  </div>
                </div>
              )}
            </EnterpriseCard>
          )}

          {/* CFO GRANULAR DRILL-DOWN LEDGER LINES MODAL */}
          <EnterpriseModal
            isOpen={!!drillAccount}
            onClose={() => setDrillAccount(null)}
            title="Sổ Chi Tiết Tài Khoản Sổ Cái"
            subtitle={drillAccount ? `Tài khoản: ${drillAccount.code} — ${drillAccount.name}` : ""}
            maxWidth="5xl"
            footer={
              <div className="flex items-center justify-between w-full text-xs">
                <div className="text-[10px] text-[var(--text-muted)] font-black uppercase tracking-wider">
                  Tổng cộng: {drillLines.length} phát sinh trên trang này
                </div>
                
                {/* Pagination */}
                {drillTotalPages > 1 && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setDrillPage(p => Math.max(1, p - 1))}
                      disabled={drillPage === 1 || loadingDrill}
                      className="h-8 w-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary)] rounded-md cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="15 18 9 12 15 6" />
                      </svg>
                    </button>
                    <span className="text-[11px] font-bold text-[var(--text-primary)] tabular-nums">
                      Trang {drillPage} / {drillTotalPages}
                    </span>
                    <button
                      onClick={() => setDrillPage(p => Math.min(drillTotalPages, p + 1))}
                      disabled={drillPage === drillTotalPages || loadingDrill}
                      className="h-8 w-8 flex items-center justify-center border border-[var(--border)] text-[var(--text-secondary)] hover:bg-[var(--secondary)] rounded-md cursor-pointer disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>
            }
          >
            {loadingDrill ? (
              <div className="flex flex-col items-center justify-center h-48 space-y-3">
                <div className="h-8 w-8 rounded-full border-2 border-[var(--primary)] border-t-transparent animate-spin" />
                <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">
                  Đang đối soát Sổ cái thời gian thực...
                </p>
              </div>
            ) : drillLines.length === 0 ? (
              <EnterpriseEmptyState
                title="Không có phát sinh phát sinh"
                description="Hệ thống chưa ghi nhận dòng tiền hay bút toán hạch toán nào của tài khoản này."
                iconType="report"
              />
            ) : (
              <EnterpriseTable
                data={drillLines}
                columns={[
                  {
                    header: "Ngày hạch toán",
                    accessor: (row) => new Date(row.journalEntry.date).toLocaleDateString('vi-VN'),
                    align: "center",
                    width: "15%"
                  },
                  {
                    header: "Số chứng từ (Ref)",
                    accessor: (row) => <span className="font-bold text-[var(--primary)]">{row.journalEntry.reference}</span>,
                    align: "center",
                    width: "15%"
                  },
                  {
                    header: "Diễn giải / Nội dung chi tiết",
                    accessor: (row) => row.description || row.journalEntry.description,
                    width: "40%"
                  },
                  {
                    header: "Phát sinh Nợ (Debit)",
                    accessor: (row) => row.type === 'DEBIT' ? formatVnd(row.amount) : '—',
                    align: "right",
                    width: "15%"
                  },
                  {
                    header: "Phát sinh Có (Credit)",
                    accessor: (row) => row.type === 'CREDIT' ? formatVnd(row.amount) : '—',
                    align: "right",
                    width: "15%"
                  },
                  {
                    header: "Nguồn nghiệp vụ",
                    accessor: (row) => (
                      <span className="inline-block px-2 py-0.5 rounded text-[9px] font-black tracking-wider uppercase bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                        {row.journalEntry.sourceType}
                      </span>
                    ),
                    align: "center",
                    width: "15%"
                  }
                ]}
                loading={loadingDrill}
              />
            )}
          </EnterpriseModal>

        </div>
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}
