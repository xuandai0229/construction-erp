'use client';

import { useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import AddPaymentModal from '@/app/components/modals/AddPaymentModal';
import PaymentHistoryModal from '@/app/components/modals/PaymentHistoryModal';
import { TableVirtuoso } from 'react-virtuoso';
import { useInvoicesQuery, useDeleteInvoiceMutation } from '@/services/queries/useDebts';
import { useCostsQuery, useUpdateCostMutation } from '@/services/queries/useCosts';
import { exportToCsv } from '@/app/services/export.service';

// Stable references for TableVirtuoso — prevents re-render loops
const InvoiceTableComponents = {
  Table: (props: any) => <table {...props} className="erp-table w-full min-w-[850px]" />,
  TableHead: (props: any) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
  TableRow: (props: any) => <tr {...props} className="group hover:bg-[var(--secondary)] transition-colors" />,
};
const CostTableComponents = {
  Table: (props: any) => <table {...props} className="erp-table w-full min-w-[720px]" />,
  TableHead: (props: any) => <thead {...props} className="bg-[var(--table-head-bg)] shadow-[0_1px_0_var(--border)] z-10 sticky top-[var(--erp-header-height)]" />,
  TableRow: (props: any) => <tr {...props} className="group hover:bg-[var(--secondary)] transition-colors" />,
};

export default function DebtPage() {
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoicesQuery(currentProjectId);
  const { data: costs = [], isLoading: isLoadingCosts } = useCostsQuery(currentProjectId);

  const { mutate: updateCost } = useUpdateCostMutation(currentProjectId);
  const { mutate: deleteInvoice } = useDeleteInvoiceMutation(currentProjectId);

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [historyInvoice, setHistoryInvoice]   = useState<string | null>(null);

  const unpaidCosts = costs.filter(c => c.status === 'unpaid');

  return (
    <div className="erp-page">
      <Sidebar activeItem="debt" />
      <main
        className={`erp-page-main transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${sidebarCollapsed ? 'md:ml-[var(--erp-sidebar-collapsed)]' : 'md:ml-[var(--erp-sidebar-width)]'}`}
      >
        <Header />

        <div className="p-6 md:p-8 space-y-8 animate-fade-in">
          {/* Page Header */}
          <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
            <h1 className="erp-section-title">Công nợ & Thanh toán</h1>
            <p className="erp-section-subtitle">Theo dõi khoản phải thu, phải trả và lịch sử thanh toán</p>
          </div>

          {/* ── RECEIVABLE ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
              <h2 className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                Phải thu khách hàng
              </h2>
              <button 
                onClick={() => {
                  if (invoices.length === 0) return;
                  const data = invoices.map(inv => ({
                    'Mã HĐ': inv.id.substring(0,8).toUpperCase(),
                    'Ngày': formatDate(inv.issuedDate),
                    'Tổng tiền': inv.amount,
                    'Đã thu': inv.paidAmount,
                    'Còn nợ': inv.remainingAmount,
                    'Trạng thái': inv.remainingAmount === 0 ? 'Hoàn tất' : 'Còn nợ'
                  }));
                  exportToCsv('Cong_No_Phai_Thu.csv', data);
                }}
                className="erp-btn h-7 px-3 bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] text-[10px]"
              >
                Xuất Excel
              </button>
              <span className="ml-auto text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {invoices.length} hóa đơn
              </span>
            </div>

            <div className="card-elevation overflow-hidden border border-[var(--border)] rounded-lg">
              <div className="overflow-x-auto scrollbar-hide">
                {isLoadingInvoices ? (
                  <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--table-head-bg)]">
                    Đang tải hóa đơn...
                  </div>
                ) : invoices.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--table-head-bg)]">
                    Chưa có hóa đơn nào
                  </div>
                ) : (
                  <TableVirtuoso
                    useWindowScroll
                    data={invoices}
                    components={InvoiceTableComponents}
                    fixedHeaderContent={() => (
                      <tr>
                        <th className="w-[110px] bg-[var(--table-head-bg)]">Mã HĐ</th>
                        <th className="w-[110px] bg-[var(--table-head-bg)]">Ngày phát hành</th>
                        <th className="w-[130px] text-right bg-[var(--table-head-bg)]">Tổng tiền</th>
                        <th className="w-[130px] text-right bg-[var(--table-head-bg)]">Đã thu</th>
                        <th className="w-[130px] text-right bg-[var(--table-head-bg)]">Còn nợ</th>
                        <th className="w-[100px] text-center bg-[var(--table-head-bg)]">Trạng thái</th>
                        <th className="w-[150px] text-center bg-[var(--table-head-bg)]">Thao tác</th>
                      </tr>
                    )}
                    itemContent={(i, inv) => (
                      <>
                        <td>
                          <button
                            onClick={() => setHistoryInvoice(inv.id)}
                            className="text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors font-mono"
                          >
                            {inv.id.substring(0, 8).toUpperCase()}
                          </button>
                        </td>
                        <td className="text-[12px] text-[var(--text-secondary)] whitespace-nowrap">
                          {formatDate(inv.issuedDate)}
                        </td>
                        <td className="text-right tabular-nums font-bold text-[var(--text-primary)] whitespace-nowrap">
                          {formatVnd(inv.amount)}
                        </td>
                        <td className="text-right tabular-nums font-bold text-emerald-500 whitespace-nowrap">
                          {formatVnd(inv.paidAmount)}
                        </td>
                        <td className="text-right tabular-nums font-extrabold text-rose-500 whitespace-nowrap">
                          {formatVnd(inv.remainingAmount)}
                        </td>
                        <td className="text-center">
                          <span className={inv.remainingAmount === 0 ? 'badge-paid' : 'badge-overdue'}>
                            {inv.remainingAmount === 0 ? 'Hoàn tất' : 'Còn nợ'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center justify-center gap-2">
                            {inv.remainingAmount > 0 && (
                              <button
                                onClick={() => setSelectedInvoice(inv.id)}
                                className="erp-btn h-7 px-3 bg-emerald-600 text-white text-[10px] hover:bg-emerald-500"
                              >
                                Thu tiền
                              </button>
                            )}
                            <button
                              onClick={() => setHistoryInvoice(inv.id)}
                              className="erp-btn h-7 px-3 border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] text-[10px] hover:text-[var(--text-primary)]"
                            >
                              Lịch sử
                            </button>
                            <button
                              onClick={() => {
                                if (window.confirm('Xóa hóa đơn sẽ xóa toàn bộ lịch sử thanh toán. Tiếp tục?')) {
                                  deleteInvoice(inv.id);
                                }
                              }}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-rose-500 hover:bg-rose-500/10 transition-colors"
                              title="Xóa hóa đơn"
                            >
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    )}
                  />
                )}
              </div>
            </div>
          </section>

          {/* ── PAYABLE ── */}
          <section className="space-y-3">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
              <h2 className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                Phải trả nhà cung cấp
              </h2>
              <button 
                onClick={() => {
                  if (unpaidCosts.length === 0) return;
                  const data = unpaidCosts.map(cost => ({
                    'Ngày': formatDate(cost.date),
                    'Nhà cung cấp': cost.supplier || 'Không rõ',
                    'Loại': cost.costType,
                    'Số tiền': cost.amount,
                    'Trạng thái': 'Chưa trả'
                  }));
                  exportToCsv('Cong_No_Phai_Tra.csv', data);
                }}
                className="erp-btn h-7 px-3 bg-[var(--secondary)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] text-[10px]"
              >
                Xuất Excel
              </button>
              <span className="ml-auto text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                {unpaidCosts.length} khoản
              </span>
            </div>

            <div className="card-elevation overflow-hidden border border-[var(--border)] rounded-lg">
              <div className="overflow-x-auto scrollbar-hide">
                {isLoadingCosts ? (
                  <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--table-head-bg)]">
                    Đang tải chi phí...
                  </div>
                ) : unpaidCosts.length === 0 ? (
                  <div className="h-32 flex items-center justify-center text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-widest bg-[var(--table-head-bg)]">
                    Không có công nợ phải trả
                  </div>
                ) : (
                  <TableVirtuoso
                    useWindowScroll
                    data={unpaidCosts}
                    components={CostTableComponents}
                    fixedHeaderContent={() => (
                      <tr>
                        <th className="w-[100px] bg-[var(--table-head-bg)]">Ngày</th>
                        <th className="min-w-[160px] bg-[var(--table-head-bg)]">Nhà cung cấp</th>
                        <th className="w-[100px] bg-[var(--table-head-bg)]">Loại</th>
                        <th className="w-[140px] text-right bg-[var(--table-head-bg)]">Số tiền</th>
                        <th className="w-[100px] text-center bg-[var(--table-head-bg)]">Trạng thái</th>
                        <th className="w-[140px] text-center bg-[var(--table-head-bg)]">Thao tác</th>
                      </tr>
                    )}
                    itemContent={(i, cost) => (
                      <>
                        <td className="whitespace-nowrap text-[12px] font-semibold text-[var(--text-muted)] group-hover:text-[var(--text-accent)] transition-colors">
                          {formatDate(cost.date)}
                        </td>
                        <td className="font-bold text-[var(--text-primary)]">
                          {cost.supplier || 'Không rõ'}
                        </td>
                        <td>
                          <span className="inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)] group-hover:text-[var(--text-accent)] transition-colors">
                            {cost.costType}
                          </span>
                        </td>
                        <td className="text-right tabular-nums font-black text-rose-500 whitespace-nowrap group-hover:text-rose-400 transition-colors">
                          {formatVnd(cost.amount)}
                        </td>
                        <td className="text-center">
                          <span className="badge-overdue">Chưa trả</span>
                        </td>
                        <td className="text-center">
                          <button
                            onClick={() => updateCost({ id: cost.id, updates: { status: 'paid' } })}
                            className="erp-btn h-7 px-3 bg-blue-600 text-white text-[10px] hover:bg-blue-500 shadow-sm shadow-blue-900/20"
                          >
                            Xác nhận đã trả
                          </button>
                        </td>
                      </>
                    )}
                  />
                )}
              </div>
            </div>
          </section>
        </div>

        <AddPaymentModal
          isOpen={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoiceId={selectedInvoice || undefined}
        />
        <PaymentHistoryModal
          isOpen={!!historyInvoice}
          onClose={() => setHistoryInvoice(null)}
          invoiceId={historyInvoice || undefined}
        />
      </main>
    </div>
  );
}
