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

export default function RevenueListPage() {
  const [showAddModal, setShowAddModal] = useState(false);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  // React Query
  const { data: revenues = [], isLoading: isLoadingRevenues } = useRevenuesQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const { mutate: updateRevenue } = useUpdateRevenueMutation(currentProjectId);

  const wbs = wbsData?.flat || [];

  const getWbsName = (id: string) => wbs.find(w => w.id === id)?.name || '—';

  const handleToggle = (id: string, current: RevenueStatus) => {
    updateRevenue({ id, updates: { status: current === 'paid' ? 'unpaid' : 'paid' } });
  };

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
                  components={{
                    Table: (props) => <table {...props} className="erp-table w-full min-w-[860px]" />,
                    TableHead: (props) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
                    TableRow: (props) => <tr {...props} className="group hover:bg-[var(--secondary)] transition-colors" />
                  }}
                  fixedHeaderContent={() => (
                    <tr>
                      <th className="w-[100px] bg-[var(--table-head-bg)]">Ngày</th>
                      <th className="min-w-[180px] bg-[var(--table-head-bg)]">Hạng mục (WBS)</th>
                      <th className="min-w-[200px] bg-[var(--table-head-bg)]">Diễn giải</th>
                      <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Số tiền</th>
                      <th className="w-[100px] text-center bg-[var(--table-head-bg)]">Trạng thái</th>
                      <th className="w-[140px] text-center bg-[var(--table-head-bg)]">Thao tác</th>
                    </tr>
                  )}
                  itemContent={(i, rev) => (
                    <>
                      <td className="whitespace-nowrap text-[12px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-accent)] transition-colors">
                        {formatDate(rev.date)}
                      </td>
                      <td className="font-bold text-[var(--text-primary)]">
                        {getWbsName(rev.wbsId)}
                      </td>
                      <td className="text-[var(--text-secondary)] text-[12.5px]">
                        {rev.description}
                      </td>
                      <td className="text-right tabular-nums font-black text-emerald-500 whitespace-nowrap group-hover:text-emerald-400 transition-colors">
                        {formatVnd(rev.amount)}
                      </td>
                      <td className="text-center">
                        <span className={rev.status === 'paid' ? 'badge-paid' : 'badge-unpaid'}>
                          {rev.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
                        </span>
                      </td>
                      <td className="text-center">
                        <button
                          onClick={() => handleToggle(rev.id, rev.status)}
                          className="text-[11px] font-bold text-[var(--text-accent)] hover:underline underline-offset-4 transition-colors"
                        >
                          {rev.status === 'paid' ? 'Đánh dấu chưa thu' : 'Xác nhận đã thu'}
                        </button>
                      </td>
                    </>
                  )}
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
