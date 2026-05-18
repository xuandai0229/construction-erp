'use client';

import { useState, useEffect, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd } from '@/app/components/dashboard-data';
import { exportToCsv } from '@/app/services/export.service';
import { useProjectsQuery } from '@/services/queries/useProjects';
import { COL_WIDTHS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';

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

  // Tab state (Batch 6.3)
  const [activeTab, setActiveTab] = useState<ReportTab>('cash_aging');
  const [financialData, setFinancialData] = useState<any>(null);
  const [loadingFinancial, setLoadingFinancial] = useState(false);

  // Classic queries (backward compatibility)
  const { data: monthlyData = [], isLoading: loadingMonthly } = useMonthlyReportQuery(currentProjectId);
  const { data: arAging = [] } = useAgingReportQuery(currentProjectId, 'receivable');
  const { data: apAging = [] } = useAgingReportQuery(currentProjectId, 'payable');
  const { data: locks = [] } = useFiscalPeriodsQuery();
  const toggleLockMutation = useToggleFiscalPeriodMutation();

  const toggleLock = (month: string) => {
    toggleLockMutation.mutate(month);
  };

  // Fetch dynamic authoritative accounting reports (Batch 6.3)
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
    
    // Register CSV export metric (Batch 7.5)
    fetch("/api/monitoring/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "CSV" })
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
    // Register PDF print metric (Batch 7.5)
    fetch("/api/monitoring/performance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "PDF" })
    }).catch(() => {});

    window.print();
  };

  return (
    <div className="erp-page">
      <Sidebar activeItem="reports" />
      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header />
        
        <div className="erp-content-container animate-fade-in space-y-6 print:p-0 print:space-y-4">
          
          {/* Page Header (Hidden in Print mode) */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 print:hidden">
            <div className="accent-line">
              <h1 className="erp-section-title">Hệ thống Báo cáo Kế toán & Tài chính</h1>
              <p className="erp-section-subtitle">Accounting-grade dynamic ledger aggregation and tax governance</p>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <select
                value={currentProjectId}
                onChange={e => setCurrentProject(e.target.value)}
                className="erp-input h-9 w-auto px-3 text-[13px] font-bold"
              >
                {projects.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>

              <button
                onClick={handlePrint}
                className="erp-btn bg-violet-600 text-white hover:bg-violet-500 gap-1.5"
                title="Xuất định dạng PDF"
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
                className="erp-btn border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] gap-1.5"
                title="Xuất định dạng CSV/Excel"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4m4-5 5 5 5-5m-5 5V3" />
                </svg>
                Xuất Excel/CSV
              </button>
            </div>
          </div>

          {/* Dynamic Tab Switcher (Hidden in Print Mode) */}
          <div className="flex border-b border-[var(--border)] gap-2 print:hidden overflow-x-auto scrollbar-hide">
            {[
              { id: 'cash_aging', label: 'Dòng tiền & Công nợ' },
              { id: 'trial_balance', label: 'Bảng Cân đối Phát sinh' },
              { id: 'balance_sheet', label: 'Bảng Cân đối Kế toán' },
              { id: 'vat_summary', label: 'Báo cáo Thuế VAT' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ReportTab)}
                className={`py-2.5 px-4 font-black text-[11px] uppercase tracking-wider transition-all border-b-2 -mb-0.5 whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-violet-500 text-violet-400 font-extrabold'
                    : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
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
              <section className="card-elevation overflow-hidden print:shadow-none print:border">
                <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between print:px-2">
                  <h2 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest print:text-black">
                    Kết quả hoạt động kinh doanh (P&L) theo tháng
                  </h2>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] italic print:hidden">
                    <span className="h-2 w-2 rounded-full bg-rose-500 shrink-0" />
                    Tháng đỏ: Kỳ kế toán đã khóa hạch toán
                  </div>
                </div>
                <div className="overflow-x-auto scrollbar-hide">
                  <table className="erp-table print:text-black">
                    <thead>
                      <tr>
                        <th className={`${COL_WIDTHS.DATE} bg-[var(--table-head-bg)] text-center px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black`}>Tháng</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black`}>Tổng Thu (Cash In)</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black`}>Tổng Chi (Cash Out)</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black`}>{ERP_TERMINOLOGY.FINANCE.REVENUE}</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black`}>Chi Phí Sổ Sách</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black`}>Lợi Nhuận Thuần</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black`}>Số Dư Lũy Kế</th>
                        <th className={`${COL_WIDTHS.STATUS} text-center bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:hidden`}>Khóa Sổ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData?.map((row: MonthlyReportRow) => {
                        const locked = locks.includes(row.month);
                        return (
                          <tr key={row.month} className={`group ${locked ? 'bg-rose-500/5 print:bg-zinc-50' : ''}`}>
                            <td className={`${COL_WIDTHS.DATE} text-center font-bold text-[var(--text-primary)] border-r border-[var(--border)] tabular-nums px-4 py-3 print:text-black`}>
                              <div className="flex items-center justify-center gap-2">
                                {locked && (
                                  <svg viewBox="0 0 24 24" className="h-3 w-3 text-rose-500 shrink-0 print:text-black" fill="currentColor">
                                    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z"/>
                                  </svg>
                                )}
                                {row.month} 
                              </div>
                            </td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-semibold text-emerald-500 whitespace-nowrap px-4 py-3 border-r border-[var(--border)] print:text-black`}>{formatVnd(row.cashIn)}</td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-semibold text-rose-500 whitespace-nowrap px-4 py-3 border-r border-[var(--border)] print:text-black`}>{formatVnd(row.cashOut)}</td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums text-[var(--text-secondary)] whitespace-nowrap px-4 py-3 border-r border-[var(--border)] print:text-black`}>{formatVnd(row.revenue)}</td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums text-[var(--text-secondary)] whitespace-nowrap px-4 py-3 border-r border-[var(--border)] print:text-black`}>{formatVnd(row.cost)}</td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-bold whitespace-nowrap px-4 py-3 border-r border-[var(--border)] print:text-black ${row.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {row.profit >= 0 ? '+' : ''}{formatVnd(row.profit)}
                            </td>
                            <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-extrabold whitespace-nowrap px-4 py-3 border-r border-[var(--border)] print:text-black ${row.runningBalance >= 0 ? 'text-blue-500' : 'text-rose-500'}`}>
                              {formatVnd(row.runningBalance)}
                            </td>
                            <td className={`${COL_WIDTHS.STATUS} text-center px-4 py-3 border-r border-[var(--border)] print:hidden`}>
                              <button
                                onClick={() => toggleLock(row.month)}
                                className={`erp-btn h-7 px-3 text-[10px] ${locked
                                  ? 'bg-rose-500/15 text-rose-500 border border-rose-500/25 hover:bg-rose-500/25'
                                  : 'bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)] hover:text-[var(--text-primary)]'
                                }`}
                              >
                                {locked ? 'Mở khóa' : 'Khóa sổ'}
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                      {monthlyData.length === 0 && (
                        <tr>
                          <td colSpan={8} className="h-32 text-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest">
                            Chưa có dữ liệu phát sinh
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </section>

              {/* Aging Debt Panel */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
                <section className="card-elevation overflow-hidden print:shadow-none print:border">
                  <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.6)] print:bg-black" />
                    <h3 className="text-[11.5px] font-black text-[var(--text-primary)] uppercase tracking-widest print:text-black">
                      Phân tích tuổi nợ phải thu (A/R Aging)
                    </h3>
                  </div>
                  <div className="p-5 space-y-3 print:p-2">
                    {agingCats.map(cat => {
                      const bucket = arAging.find((b: any) => b.bucket === cat);
                      const total = bucket?.amount || 0;
                      const count = bucket?.count || 0;
                      return (
                        <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)] print:bg-white print:text-black">
                          <div>
                            <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider print:text-zinc-500">{agingLabels[cat] || cat}</div>
                            <div className="text-[13px] font-black text-[var(--text-primary)] tabular-nums mt-0.5 print:text-black">{formatVnd(total)}</div>
                          </div>
                          <div className="text-[10.5px] text-[var(--text-muted)] print:text-zinc-500">{count} khoản</div>
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="card-elevation overflow-hidden print:shadow-none print:border">
                  <div className="px-5 py-4 border-b border-[var(--border)] flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(239,68,68,0.6)] print:bg-black" />
                    <h3 className="text-[11.5px] font-black text-[var(--text-primary)] uppercase tracking-widest print:text-black">
                      Phân tích tuổi nợ phải trả (A/P Aging)
                    </h3>
                  </div>
                  <div className="p-5 space-y-3 print:p-2">
                    {agingCats.map(cat => {
                      const bucket = apAging.find((b: any) => b.bucket === cat);
                      const total = bucket?.amount || 0;
                      const count = bucket?.count || 0;
                      return (
                        <div key={cat} className="flex items-center justify-between p-3 rounded-xl bg-[var(--secondary)] border border-[var(--border)] print:bg-white print:text-black">
                          <div>
                            <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider print:text-zinc-500">{agingLabels[cat] || cat}</div>
                            <div className="text-[13px] font-black text-[var(--text-primary)] tabular-nums mt-0.5 print:text-black">{formatVnd(total)}</div>
                          </div>
                          <div className="text-[10.5px] text-[var(--text-muted)] print:text-zinc-500">{count} khoản</div>
                        </div>
                      );
                    })}
                  </div>
                </section>
              </div>
            </div>
          )}

          {/* TAB CONTENT 2: TRIAL BALANCE */}
          {activeTab === 'trial_balance' && (
            <section className="card-elevation overflow-hidden print:shadow-none print:border">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest print:text-black">
                  Bảng Cân đối Phát sinh Tài khoản (Trial Balance)
                </h2>
                <div className="text-[10.5px] text-[var(--text-muted)] italic print:hidden">
                  Đối soát kép: Tổng Nợ (Debit) = Tổng Có (Credit)
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingFinancial ? (
                  <div className="p-12 text-center text-[12px] text-[var(--text-muted)] italic animate-pulse">
                    Đang tổng hợp Sổ cái tài khoản...
                  </div>
                ) : (
                  <table className="erp-table print:text-black">
                    <thead>
                      <tr>
                        <th className="w-24 text-center bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Mã TK</th>
                        <th className="text-left bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Tên Tài Khoản Sổ Cái</th>
                        <th className="w-28 text-center bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Loại TK</th>
                        <th className="w-40 text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Phát Sinh Nợ (Debit)</th>
                        <th className="w-40 text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Phát Sinh Có (Credit)</th>
                        <th className="w-40 text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Dư Cuối Kỳ (Balance)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData?.trialBalance.map((row: any) => (
                        <tr key={row.code} className="hover:bg-[var(--secondary)]/40">
                          <td className="text-center font-bold text-[var(--text-primary)] border-r border-[var(--border)] tabular-nums px-4 py-2.5 print:text-black">{row.code}</td>
                          <td className="text-left font-bold text-[var(--text-secondary)] border-r border-[var(--border)] px-4 py-2.5 print:text-black">{row.name}</td>
                          <td className="text-center border-r border-[var(--border)] text-[10px] font-black uppercase text-violet-400 px-4 py-2.5 print:text-zinc-600">{row.type}</td>
                          <td className="text-right border-r border-[var(--border)] font-semibold text-emerald-400 tabular-nums px-4 py-2.5 print:text-black">{formatVnd(row.debitSum)}</td>
                          <td className="text-right border-r border-[var(--border)] font-semibold text-rose-400 tabular-nums px-4 py-2.5 print:text-black">{formatVnd(row.creditSum)}</td>
                          <td className="text-right font-extrabold text-blue-500 tabular-nums px-4 py-2.5 print:text-black">{formatVnd(row.balance)}</td>
                        </tr>
                      ))}
                      {/* Double entry summary row */}
                      {financialData?.trialBalance.length > 0 && (
                        <tr className="bg-[var(--secondary)]/70 font-black border-t-2 border-[var(--border)] print:bg-zinc-200">
                          <td colSpan={3} className="text-right uppercase tracking-wider text-[10px] px-4 py-3 print:text-black">
                            TỔNG CỘNG ĐỐI SOÁT LEDGER
                          </td>
                          <td className="text-right text-emerald-500 tabular-nums px-4 py-3 print:text-black border-r border-[var(--border)]">
                            {formatVnd(financialData.trialBalance.reduce((s: number, r: any) => s + r.debitSum, 0))}
                          </td>
                          <td className="text-right text-rose-500 tabular-nums px-4 py-3 print:text-black border-r border-[var(--border)]">
                            {formatVnd(financialData.trialBalance.reduce((s: number, r: any) => s + r.creditSum, 0))}
                          </td>
                          <td className="text-right text-blue-500 tabular-nums px-4 py-3 print:text-black">
                            {formatVnd(financialData.trialBalance.reduce((s: number, r: any) => s + Math.abs(r.balance), 0) / 2)}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

          {/* TAB CONTENT 3: BALANCE SHEET */}
          {activeTab === 'balance_sheet' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print:grid-cols-2 print:gap-4">
              
              {/* ASSETS */}
              <section className="card-elevation overflow-hidden print:shadow-none print:border">
                <div className="px-5 py-4 border-b border-[var(--border)] bg-emerald-500/5 print:bg-zinc-100">
                  <h3 className="text-[12px] font-black text-emerald-400 uppercase tracking-widest print:text-black">
                    PHẦN I: TÀI SẢN (ASSETS)
                  </h3>
                </div>
                <div className="p-3">
                  <table className="w-full text-[11px] print:text-black">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[9.5px] uppercase tracking-wider text-[var(--text-muted)] font-black print:text-zinc-600">
                        <th className="text-left py-2">Chỉ tiêu tài sản</th>
                        <th className="text-center w-20 py-2">Mã TK</th>
                        <th className="text-right w-36 py-2">Số dư cuối kỳ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {financialData?.balanceSheet.assets.map((row: any) => (
                        <tr key={row.code} className="hover:bg-[var(--secondary)]/40">
                          <td className="py-2.5 font-bold text-[var(--text-secondary)] print:text-black">{row.name}</td>
                          <td className="text-center font-bold text-[var(--text-primary)] tabular-nums print:text-black">{row.code}</td>
                          <td className="text-right font-extrabold text-blue-500 tabular-nums print:text-black">{formatVnd(row.balance)}</td>
                        </tr>
                      ))}
                      {/* Total Assets Row */}
                      <tr className="font-black text-[12px] bg-[var(--secondary)]/60 border-t-2 border-[var(--border)] print:bg-zinc-200">
                        <td className="py-3 uppercase text-emerald-500 print:text-black">TỔNG CỘNG TÀI SẢN</td>
                        <td className="text-center">-</td>
                        <td className="text-right text-emerald-500 tabular-nums print:text-black">
                          {formatVnd(financialData?.balanceSheet.assets.reduce((s: number, r: any) => s + r.balance, 0) || 0)}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* LIABILITIES & EQUITIES */}
              <section className="card-elevation overflow-hidden print:shadow-none print:border">
                <div className="px-5 py-4 border-b border-[var(--border)] bg-rose-500/5 print:bg-zinc-100">
                  <h3 className="text-[12px] font-black text-rose-400 uppercase tracking-widest print:text-black">
                    PHẦN II: NGUỒN VỐN & PHẢI TRẢ
                  </h3>
                </div>
                <div className="p-3">
                  <table className="w-full text-[11px] print:text-black">
                    <thead>
                      <tr className="border-b border-[var(--border)] text-[9.5px] uppercase tracking-wider text-[var(--text-muted)] font-black print:text-zinc-600">
                        <th className="text-left py-2">Chỉ tiêu nguồn vốn</th>
                        <th className="text-center w-20 py-2">Mã TK</th>
                        <th className="text-right w-36 py-2">Số dư cuối kỳ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--border)]">
                      {/* Liabilities */}
                      <tr className="bg-[var(--secondary)]/40 font-black text-[10px] uppercase text-[var(--text-muted)] print:text-black">
                        <td colSpan={3} className="py-1 px-1">A. NỢ PHẢI TRẢ (LIABILITIES)</td>
                      </tr>
                      {financialData?.balanceSheet.liabilities.map((row: any) => (
                        <tr key={row.code} className="hover:bg-[var(--secondary)]/40">
                          <td className="py-2.5 font-bold text-[var(--text-secondary)] pl-4 print:text-black">{row.name}</td>
                          <td className="text-center font-bold text-[var(--text-primary)] tabular-nums print:text-black">{row.code}</td>
                          <td className="text-right font-extrabold text-rose-500 tabular-nums print:text-black">{formatVnd(row.balance)}</td>
                        </tr>
                      ))}

                      {/* Equities */}
                      <tr className="bg-[var(--secondary)]/40 font-black text-[10px] uppercase text-[var(--text-muted)] print:text-black">
                        <td colSpan={3} className="py-1 px-1 mt-2">B. VỐN CHỦ SỞ HỮU (EQUITY)</td>
                      </tr>
                      {financialData?.balanceSheet.equity.map((row: any) => (
                        <tr key={row.code} className="hover:bg-[var(--secondary)]/40">
                          <td className="py-2.5 font-bold text-[var(--text-secondary)] pl-4 print:text-black">{row.name}</td>
                          <td className="text-center font-bold text-[var(--text-primary)] tabular-nums print:text-black">{row.code}</td>
                          <td className="text-right font-extrabold text-blue-500 tabular-nums print:text-black">{formatVnd(row.balance)}</td>
                        </tr>
                      ))}

                      {/* Total Liabilities & Equity Row */}
                      <tr className="font-black text-[12px] bg-[var(--secondary)]/60 border-t-2 border-[var(--border)] print:bg-zinc-200">
                        <td className="py-3 uppercase text-rose-500 print:text-black">TỔNG CỘNG NGUỒN VỐN</td>
                        <td className="text-center">-</td>
                        <td className="text-right text-rose-500 tabular-nums print:text-black">
                          {formatVnd(
                            (financialData?.balanceSheet.liabilities.reduce((s: number, r: any) => s + r.balance, 0) || 0) +
                            (financialData?.balanceSheet.equity.reduce((s: number, r: any) => s + r.balance, 0) || 0)
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

            </div>
          )}

          {/* TAB CONTENT 4: VAT SUMMARY */}
          {activeTab === 'vat_summary' && (
            <section className="card-elevation overflow-hidden print:shadow-none print:border">
              <div className="px-6 py-4 border-b border-[var(--border)] flex items-center justify-between">
                <h2 className="text-[12px] font-black text-[var(--text-primary)] uppercase tracking-widest print:text-black">
                  Báo cáo Tổng hợp Thuế GTGT đầu vào (VAT Summary)
                </h2>
                <div className="text-[10.5px] text-[var(--text-muted)] italic print:hidden">
                  Khớp nối: Tổng tiền sau thuế = Tổng trước thuế + Thuế suất GTGT
                </div>
              </div>
              <div className="overflow-x-auto">
                {loadingFinancial ? (
                  <div className="p-12 text-center text-[12px] text-[var(--text-muted)] italic animate-pulse">
                    Đang lập tờ khai thuế VAT chi tiết...
                  </div>
                ) : (
                  <table className="erp-table print:text-black">
                    <thead>
                      <tr>
                        <th className="w-24 text-center bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Ngày</th>
                        <th className="text-left bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Nhà cung cấp / Đối tác</th>
                        <th className="text-left bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Nội dung chi tiết chứng từ</th>
                        <th className="w-32 text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Giá chưa thuế (Net)</th>
                        <th className="w-20 text-center bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Thuế suất</th>
                        <th className="w-32 text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Tiền thuế VAT</th>
                        <th className="w-36 text-right bg-[var(--table-head-bg)] px-4 py-2 uppercase text-[10px] tracking-widest text-[var(--text-muted)] font-black print:bg-zinc-100 print:text-black">Tổng thanh toán</th>
                      </tr>
                    </thead>
                    <tbody>
                      {financialData?.vatSummary.map((row: any) => (
                        <tr key={row.id} className="hover:bg-[var(--secondary)]/40">
                          <td className="text-center font-bold text-[var(--text-primary)] border-r border-[var(--border)] tabular-nums px-4 py-2.5 print:text-black">{new Date(row.date).toLocaleDateString('vi-VN')}</td>
                          <td className="text-left font-bold text-[var(--text-secondary)] border-r border-[var(--border)] px-4 py-2.5 print:text-black">{row.supplier}</td>
                          <td className="text-left border-r border-[var(--border)] text-[var(--text-muted)] px-4 py-2.5 print:text-zinc-600">{row.note}</td>
                          <td className="text-right border-r border-[var(--border)] tabular-nums px-4 py-2.5 print:text-black">{formatVnd(row.netAmount)}</td>
                          <td className="text-center border-r border-[var(--border)] font-bold text-violet-400 tabular-nums px-4 py-2.5 print:text-black">{row.vatRate}%</td>
                          <td className="text-right border-r border-[var(--border)] font-semibold text-rose-500 tabular-nums px-4 py-2.5 print:text-black">{formatVnd(row.vatAmount)}</td>
                          <td className="text-right font-extrabold text-blue-500 tabular-nums px-4 py-2.5 print:text-black">{formatVnd(row.amount)}</td>
                        </tr>
                      ))}
                      {/* Summary VAT row */}
                      {financialData?.vatSummary.length > 0 && (
                        <tr className="bg-[var(--secondary)]/70 font-black border-t-2 border-[var(--border)] print:bg-zinc-200">
                          <td colSpan={3} className="text-right uppercase tracking-wider text-[10px] px-4 py-3 print:text-black">
                            TỔNG KÊ KHAI THUẾ GTGT ĐẦU VÀO
                          </td>
                          <td className="text-right text-[var(--text-primary)] tabular-nums px-4 py-3 print:text-black border-r border-[var(--border)]">
                            {formatVnd(financialData.vatSummary.reduce((s: number, r: any) => s + r.netAmount, 0))}
                          </td>
                          <td className="text-center border-r border-[var(--border)]">-</td>
                          <td className="text-right text-rose-500 tabular-nums px-4 py-3 print:text-black border-r border-[var(--border)]">
                            {formatVnd(financialData.vatSummary.reduce((s: number, r: any) => s + r.vatAmount, 0))}
                          </td>
                          <td className="text-right text-blue-500 tabular-nums px-4 py-3 print:text-black">
                            {formatVnd(financialData.vatSummary.reduce((s: number, r: any) => s + r.amount, 0))}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}
