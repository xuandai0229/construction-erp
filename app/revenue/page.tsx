'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import { RevenueStatus } from '@/app/types';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import { TableVirtuoso } from 'react-virtuoso';
import { useRevenuesQuery, useUpdateRevenueMutation } from '@/services/queries/useRevenues';
import { useWBSQuery } from '@/services/queries/useWBS';
import { exportToCsv } from '@/app/services/export.service';

const StableTableComponents = {
  Table: (props: any) => <table {...props} className="erp-table w-full min-w-[860px]" />,
  TableHead: (props: any) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-0" />,
  TableRow: (props: any) => <tr {...props} className="erp-table-row group border-b border-[var(--border)] last:border-b-0" />,
  TableFoot: (props: any) => <tfoot {...props} className="bg-[var(--table-head-bg)] shadow-[0_-1px_0_var(--border)] z-10 sticky bottom-0 font-black text-[var(--text-primary)]" />,
};

export default function RevenueListPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  // React Query
  const { data: revenues = [], isLoading: isLoadingRevenues } = useRevenuesQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const { mutate: updateRevenue } = useUpdateRevenueMutation(currentProjectId);

  const wbs = wbsData?.flat || [];

  const getWbsName = (id: string) => wbs.find(w => w.id === id)?.name || '—';

  const handleToggle = (id: string, current: RevenueStatus) => {
    if (processingId) return;
    const actionLabel = current === 'paid' ? 'Hoàn bút toán (Hủy thu)' : 'Ghi nhận đã thu';
    if (!confirm(`Bạn có chắc chắn muốn thực hiện: ${actionLabel}?`)) return;

    setProcessingId(id);
    updateRevenue(
      { id, updates: { status: current === 'paid' ? 'unpaid' : 'paid' } },
      {
        onSettled: () => setProcessingId(null)
      }
    );
  };

  const totalAmount = revenues.reduce((sum, r) => sum + Number(r.amount), 0);

  return (
    <>
    <AddRevenueModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
    <div className="erp-page">
      <Sidebar activeItem="revenue" />
      <main
        className={`erp-page-main transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}
      >
        <Header />

        <div className="p-6 md:p-8 space-y-6 animate-fade-in">
          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--border)] pb-6">
            <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
              <h1 className="erp-section-title">Doanh thu</h1>
              <p className="erp-section-subtitle">Quản lý các khoản thu và trạng thái thanh toán</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <button 
                onClick={() => {
                  if (revenues.length === 0) return;
                  const headers = ['Ngày', 'Hạng mục', 'Diễn giải', 'Trước thuế', 'VAT', 'Tổng doanh thu', 'Trạng thái'];
                  const rows = revenues.map(rev => {
                    const net = Math.round(Number(rev.amount) / 1.1);
                    const vat = Math.round(Number(rev.amount) - net);
                    return [
                      formatDate(rev.date),
                      getWbsName(rev.wbsId),
                      rev.description || '',
                      net,
                      vat,
                      rev.amount,
                      rev.status === 'paid' ? 'Đã thu' : 'Chưa thu'
                    ];
                  });
                  exportToCsv('ERP_Revenue', headers, rows);
                }}
                className="erp-btn bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--hover-bg)] gap-2 px-5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4-4-4m4 4V4" /></svg>
                Xuất Excel
              </button>
              <button 
                onClick={() => setShowAddModal(true)}
                className="erp-btn bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/20 gap-2 px-5"
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Thêm doanh thu
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="card-elevation overflow-hidden border border-[var(--border)] rounded-lg">
            <div className="overflow-x-auto scrollbar-hide">
              {isLoadingRevenues ? (
                <div className="h-32 flex flex-col items-center justify-center bg-[var(--table-head-bg)]">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
                  <div className="text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest mt-3">
                    Đang tải doanh thu...
                  </div>
                </div>
              ) : revenues.length === 0 ? (
                <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--table-head-bg)]">
                  Chưa có bản ghi doanh thu nào
                </div>
              ) : (
                <TableVirtuoso
                  useWindowScroll
                  data={revenues}
                  fixedHeaderContent={() => (
                    <tr>
                      <th className="py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--table-head-bg)] w-[110px]">Ngày</th>
                      <th className="py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--table-head-bg)] min-w-[180px]">Hạng mục (WBS)</th>
                      <th className="py-3 px-4 text-left text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--table-head-bg)] min-w-[200px]">Diễn giải</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--table-head-bg)] w-[130px]">Trước thuế</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--table-head-bg)] w-[110px]">VAT (10%)</th>
                      <th className="py-3 px-4 text-right text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--table-head-bg)] w-[140px]">Tổng doanh thu</th>
                      <th className="py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-r border-[var(--border)] bg-[var(--table-head-bg)] w-[120px]">Trạng thái</th>
                      <th className="py-3 px-4 text-center text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-[0.15em] whitespace-nowrap border-b border-[var(--border)] bg-[var(--table-head-bg)] w-[140px]">Nghiệp vụ</th>
                    </tr>
                  )}
                  itemContent={(i, rev) => {
                    const vatRate = 10;
                    const net = Math.round(Number(rev.amount) / (1 + vatRate / 100));
                    const vat = Math.round(Number(rev.amount) - net);

                    return (
                    <>
                      <td className="py-3 px-4 border-r border-[var(--border)] whitespace-nowrap text-[12px] font-bold text-[var(--text-muted)] group-hover:text-[var(--text-accent)] transition-colors">
                        {formatDate(rev.date)}
                      </td>
                      <td className="py-3 px-4 border-r border-[var(--border)] font-bold text-[var(--text-primary)]">
                        {getWbsName(rev.wbsId)}
                      </td>
                      <td className="py-3 px-4 border-r border-[var(--border)] text-[var(--text-secondary)] text-[12.5px]">
                        {rev.description || '—'}
                      </td>
                      <td className="py-3 px-4 border-r border-[var(--border)] text-right tabular-nums font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                        {formatVnd(net)}
                      </td>
                      <td className="py-3 px-4 border-r border-[var(--border)] text-right tabular-nums font-semibold text-[var(--text-secondary)] whitespace-nowrap">
                        {formatVnd(vat)}
                      </td>
                      <td className="py-3 px-4 border-r border-[var(--border)] text-right tabular-nums font-black text-emerald-500 whitespace-nowrap group-hover:text-emerald-400 transition-colors">
                        {formatVnd(rev.amount)}
                      </td>
                      <td className="py-3 px-4 border-r border-[var(--border)] text-center">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            rev.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30'
                          }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${rev.status === 'paid' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'}`}></span>
                          {rev.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          disabled={!!processingId}
                          onClick={() => handleToggle(rev.id, rev.status)}
                          className={`text-[11px] font-bold hover:underline underline-offset-4 transition-colors disabled:opacity-50 disabled:pointer-events-none ${
                            rev.status === 'paid' ? 'text-rose-500' : 'text-emerald-500'
                          }`}
                        >
                          {processingId === rev.id ? 'Đang xử lý...' : rev.status === 'paid' ? 'Hoàn bút toán' : 'Ghi nhận đã thu'}
                        </button>
                      </td>
                    </>
                  )}}
                  components={StableTableComponents}
                  fixedFooterContent={() => {
                    if (revenues.length === 0) return null;
                    const totalNet = revenues.reduce((sum, r) => sum + Math.round(Number(r.amount) / 1.1), 0);
                    const totalVat = revenues.reduce((sum, r) => sum + Math.round(Number(r.amount) - Math.round(Number(r.amount) / 1.1)), 0);
                    const totalAmount = revenues.reduce((sum, r) => sum + Number(r.amount), 0);

                    return (
                      <tr className="bg-[var(--table-head-bg)] shadow-[0_-1px_0_var(--border)] font-bold text-[var(--text-primary)] z-20 sticky bottom-0">
                        <td colSpan={3} className="py-3 px-4 text-right text-[11px] uppercase tracking-wider text-[var(--text-secondary)] border-r border-t-2 border-[var(--border)]">
                          Tổng cộng
                        </td>
                        <td className="py-3 px-4 text-right tabular-nums text-[11.5px] border-r border-t-2 border-[var(--border)]">{formatVnd(totalNet)}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-[11.5px] border-r border-t-2 border-[var(--border)]">{formatVnd(totalVat)}</td>
                        <td className="py-3 px-4 text-right tabular-nums text-[13px] font-black text-emerald-500 border-r border-t-2 border-[var(--border)]">{formatVnd(totalAmount)}</td>
                        <td colSpan={2} className="border-t-2 border-[var(--border)]"></td>
                      </tr>
                    );
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
