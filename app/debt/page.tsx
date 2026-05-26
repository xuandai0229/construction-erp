'use client';

import { useState, useMemo } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatVnd, formatDate } from '@/app/components/dashboard-data';
import AddPaymentModal from '@/app/components/modals/AddPaymentModal';
import PaymentHistoryModal from '@/app/components/modals/PaymentHistoryModal';
import VendorPaymentModal from '@/app/components/modals/VendorPaymentModal';
import { TableVirtuoso } from 'react-virtuoso';
import { useInvoicesQuery, useDeleteInvoiceMutation } from '@/services/queries/useDebts';
import { useCostsQuery, useUpdateCostMutation } from '@/services/queries/useCosts';
import { exportToCsv } from '@/app/services/export.service';
import { COL_WIDTHS, ERP_TERMINOLOGY } from '@/app/utils/table-constants';

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
  const [processingId, setProcessingId]       = useState<string | null>(null);
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  const [selectedCost, setSelectedCost]       = useState<any | null>(null);

  const unpaidCosts = useMemo(() => costs.filter(c => c.status === 'unpaid'), [costs]);

  // Enterprise Ledger: Realtime totals with overdue calculation
  const { totalReceivable, totalPaid, totalRemaining, totalOverdue } = useMemo(() => {
    let tr = 0, tp = 0, trem = 0, to = 0;
    const now = new Date();
    invoices.forEach(inv => {
      tr += Number(inv.amount || 0);
      tp += Number(inv.paidAmount || 0);
      const rem = Number(inv.remainingAmount || 0);
      trem += rem;
      
      if (rem > 0 && inv.dueDate) {
        if (now > new Date(inv.dueDate)) to += rem;
      } else if (rem > 0 && !inv.dueDate && inv.issuedDate) {
         const due = new Date(inv.issuedDate);
         due.setDate(due.getDate() + 30);
         if (now > due) to += rem;
      }
    });
    return { totalReceivable: tr, totalPaid: tp, totalRemaining: trem, totalOverdue: to };
  }, [invoices]);

  const totalPayable = useMemo(() => unpaidCosts.reduce((sum, c) => sum + Number(c.amount || 0), 0), [unpaidCosts]);

  return (
    <div className="erp-page">
      <Sidebar activeItem="debt" />
      <main
        className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}
      >
        <Header />
        <div className="erp-content-container animate-fade-in space-y-8">
          {/* Page Header */}
          <div className="accent-line border-l-4 border-[var(--text-accent)] pl-4">
            <h1 className="erp-section-title">Công nợ & Thanh toán</h1>
            <p className="erp-section-subtitle">Theo dõi khoản phải thu, phải trả và lịch sử thanh toán</p>
          </div>

          {/* ── RECEIVABLE ── */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]" />
                <h2 className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                  Phải thu khách hàng
                </h2>
                <span className="ml-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {invoices.length} hóa đơn
                </span>
              </div>
              <div className="flex items-center gap-3">
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
                  className="erp-btn h-8 px-4 bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--hover-bg)] gap-2 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4-4-4m4 4V4" /></svg>
                  Xuất Excel
                </button>
              </div>
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
                        <th className={`${COL_WIDTHS.DATE} bg-[var(--table-head-bg)] text-center`}>Mã HĐ</th>
                        <th className={`${COL_WIDTHS.DATE} bg-[var(--table-head-bg)] text-center`}>Ngày phát hành</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)]`}>{ERP_TERMINOLOGY.FINANCE.BUDGET}</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)]`}>Đã thu</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)]`}>Còn nợ</th>
                        <th className={`${COL_WIDTHS.STATUS} text-center bg-[var(--table-head-bg)]`}>{ERP_TERMINOLOGY.STATUS.TITLE}</th>
                        <th className={`${COL_WIDTHS.ACTIONS} text-center bg-[var(--table-head-bg)]`}>{ERP_TERMINOLOGY.ACTIONS.TITLE}</th>
                      </tr>
                    )}
                    itemContent={(i, inv) => {
                      const now = new Date();
                      let isOverdue = false;
                      let isDueSoon = false;
                      if (inv.remainingAmount > 0) {
                        let due = inv.dueDate ? new Date(inv.dueDate) : (() => {
                          const d = new Date(inv.issuedDate);
                          d.setDate(d.getDate() + 30);
                          return d;
                        })();
                        
                        if (now > due) {
                          isOverdue = true;
                        } else {
                          const diffTime = Math.abs(due.getTime() - now.getTime());
                          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
                          if (diffDays <= 7) isDueSoon = true;
                        }
                      }

                      return (
                      <>
                        <td className={`${COL_WIDTHS.DATE} text-center`}>
                          <button
                            onClick={() => setHistoryInvoice(inv.id)}
                            className="text-[12px] font-bold text-[var(--text-muted)] hover:text-[var(--text-accent)] transition-colors font-mono"
                          >
                            {inv.id.substring(0, 8).toUpperCase()}
                          </button>
                        </td>
                        <td className={`${COL_WIDTHS.DATE} text-center text-[12px] font-semibold text-[var(--text-secondary)] whitespace-nowrap tabular-nums`}>
                          {formatDate(inv.issuedDate)}
                        </td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-bold text-[var(--text-primary)] whitespace-nowrap`}>
                          {formatVnd(inv.amount)}
                        </td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-bold text-emerald-500 whitespace-nowrap`}>
                          {formatVnd(inv.paidAmount)}
                        </td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-extrabold ${isOverdue ? 'text-rose-500' : 'text-amber-500'} whitespace-nowrap`}>
                          {formatVnd(inv.remainingAmount)}
                        </td>
                        <td className={`${COL_WIDTHS.STATUS} text-center`}>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest ${
                            inv.remainingAmount === 0 
                              ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' 
                              : isOverdue 
                                ? 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30' 
                                : isDueSoon
                                  ? 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30'
                                  : 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30'
                          }`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${
                              inv.remainingAmount === 0 ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' 
                              : isOverdue ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                              : isDueSoon ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]'
                              : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                            }`}></span>
                            {inv.remainingAmount === 0 ? 'Hoàn tất' : isOverdue ? 'Quá hạn' : isDueSoon ? 'Sắp đến hạn' : 'Trong hạn'}
                          </span>
                        </td>
                        <td className={`${COL_WIDTHS.ACTIONS}`}>
                          <div className="flex items-center justify-center gap-2">
                            {inv.remainingAmount > 0 && (
                              <button
                                disabled={!!deletingId}
                                onClick={() => setSelectedInvoice(inv.id)}
                                className="erp-btn h-7 px-3 bg-emerald-600 text-white text-[10px] hover:bg-emerald-500 disabled:opacity-50 disabled:pointer-events-none"
                              >
                                Thu tiền
                              </button>
                            )}
                            <button
                              disabled={!!deletingId}
                              onClick={() => setHistoryInvoice(inv.id)}
                              className="erp-btn h-7 px-3 border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] text-[10px] hover:text-[var(--text-primary)] disabled:opacity-50 disabled:pointer-events-none"
                            >
                              Lịch sử
                            </button>
                            <button
                              disabled={!!deletingId || inv.paidAmount > 0}
                              onClick={() => {
                                if (inv.paidAmount > 0) {
                                  alert('KHÔNG THỂ XÓA: Hóa đơn này đã phát sinh giao dịch thanh toán. Vui lòng hoàn bút toán trước khi xóa.');
                                  return;
                                }
                                if (window.confirm('CẢNH BÁO DB: Bạn có chắc chắn muốn xóa hóa đơn này? Thao tác này sẽ xóa vĩnh viễn hóa đơn (Hard Delete).')) {
                                  setDeletingId(inv.id);
                                  deleteInvoice(inv.id, {
                                    onSettled: () => setDeletingId(null)
                                  });
                                }
                              }}
                              className={`flex h-7 w-7 items-center justify-center rounded-lg transition-colors ${
                                inv.paidAmount > 0 ? 'text-[var(--text-muted)] cursor-not-allowed opacity-30' : 'text-rose-500 hover:bg-rose-500/10'
                              } ${deletingId === inv.id ? 'animate-pulse' : ''}`}
                              title={inv.paidAmount > 0 ? "Không thể xóa hóa đơn đã thanh toán" : "Xóa hóa đơn"}
                            >
                              <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                              </svg>
                            </button>
                          </div>
                        </td>
                      </>
                    )}}
                    fixedFooterContent={() => (
                      <tr className="bg-[var(--table-head-bg)] shadow-[0_-1px_0_var(--border)] font-bold text-[var(--text-primary)] z-20 sticky bottom-0">
                        <td colSpan={2} className="text-right px-4 py-3 text-[11px] uppercase tracking-wider text-[var(--text-secondary)] border-r border-t-2 border-[var(--border)]">Tổng phải thu</td>
                        <td className="text-right px-4 py-3 tabular-nums text-[12px] border-r border-t-2 border-[var(--border)]">{formatVnd(totalReceivable)}</td>
                        <td className="text-right px-4 py-3 tabular-nums text-[12px] text-emerald-500 border-r border-t-2 border-[var(--border)]">{formatVnd(totalPaid)}</td>
                        <td className="text-right px-4 py-3 tabular-nums text-[12px] font-black text-rose-500 border-r border-t-2 border-[var(--border)]">
                          {formatVnd(totalRemaining)}
                          {totalOverdue > 0 && <div className="text-[9.5px] text-rose-500 mt-1 uppercase tracking-widest">(Quá hạn: {formatVnd(totalOverdue)})</div>}
                        </td>
                        <td colSpan={2} className="border-t-2 border-[var(--border)]"></td>
                      </tr>
                    )}
                  />
                )}
              </div>
            </div>
          </section>

          {/* ── PAYABLE ── */}
          <section className="space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-2 w-2 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                <h2 className="text-[13px] font-black text-[var(--text-primary)] uppercase tracking-widest">
                  Phải trả nhà cung cấp
                </h2>
                <span className="ml-2 text-[11px] font-bold text-[var(--text-muted)] uppercase tracking-wider">
                  {unpaidCosts.length} khoản
                </span>
              </div>
              <div className="flex items-center gap-3">
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
                  className="erp-btn h-8 px-4 bg-[var(--secondary)] text-[var(--text-primary)] border border-[var(--border)] hover:bg-[var(--hover-bg)] gap-2 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 16v1a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3v-1m-4-4-4 4-4-4m4 4V4" /></svg>
                  Xuất Excel
                </button>
              </div>
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
                        <th className={`${COL_WIDTHS.DATE} bg-[var(--table-head-bg)] text-center`}>Ngày</th>
                        <th className={`min-w-[160px] bg-[var(--table-head-bg)] text-left px-4`}>Nhà cung cấp</th>
                        <th className={`${COL_WIDTHS.DATE} bg-[var(--table-head-bg)] text-center`}>Loại</th>
                        <th className={`${COL_WIDTHS.FINANCIAL} text-right bg-[var(--table-head-bg)]`}>Số tiền</th>
                        <th className={`${COL_WIDTHS.STATUS} text-center bg-[var(--table-head-bg)]`}>Tình trạng</th>
                        <th className={`${COL_WIDTHS.ACTIONS} text-center bg-[var(--table-head-bg)]`}>{ERP_TERMINOLOGY.ACTIONS.TITLE}</th>
                      </tr>
                    )}
                    itemContent={(i, cost) => (
                      <>
                        <td className={`${COL_WIDTHS.DATE} text-center whitespace-nowrap text-[12px] font-semibold text-[var(--text-muted)] tabular-nums`}>
                          {formatDate(cost.date)}
                        </td>
                        <td className="min-w-[160px] px-4 font-bold text-[var(--text-primary)]">
                          {cost.supplier || 'Không rõ'}
                        </td>
                        <td className={`${COL_WIDTHS.DATE} text-center`}>
                          <span className="inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-[var(--secondary)] text-[var(--text-muted)] border border-[var(--border)]">
                            {cost.costType === 'material' ? 'VẬT TƯ' : cost.costType === 'labor' ? 'NHÂN CÔNG' : 'DỊCH VỤ'}
                          </span>
                        </td>
                        <td className={`${COL_WIDTHS.FINANCIAL} text-right tabular-nums font-black text-rose-500 whitespace-nowrap`}>
                          {formatVnd(cost.amount)}
                        </td>
                        <td className={`${COL_WIDTHS.STATUS} text-center`}>
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30`}>
                            <span className={`h-1.5 w-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]`}></span>
                            Chưa trả
                          </span>
                        </td>
                        <td className={`${COL_WIDTHS.ACTIONS} text-center`}>
                          <button
                            onClick={() => setSelectedCost(cost)}
                            className="erp-btn h-7 px-3 bg-blue-600 text-white text-[10px] hover:bg-blue-500 shadow-sm shadow-blue-900/20"
                          >
                            Chi tiền
                          </button>
                        </td>
                      </>
                    )}
                    fixedFooterContent={() => (
                      <tr className="bg-[var(--table-head-bg)] shadow-[0_-1px_0_var(--border)] font-bold text-[var(--text-primary)] z-20 sticky bottom-0">
                        <td colSpan={3} className="text-right px-4 py-3 text-[11px] uppercase tracking-wider text-[var(--text-secondary)] border-r border-t-2 border-[var(--border)]">Tổng phải trả</td>
                        <td className="text-right px-4 py-3 tabular-nums text-[12px] font-black text-rose-500 border-r border-t-2 border-[var(--border)]">{formatVnd(totalPayable)}</td>
                        <td colSpan={2} className="border-t-2 border-[var(--border)]"></td>
                      </tr>
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
        <VendorPaymentModal
          isOpen={!!selectedCost}
          onClose={() => setSelectedCost(null)}
          cost={selectedCost}
        />
      </main>
    </div>
  );
}
