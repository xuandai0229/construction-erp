'use client';

import { useMemo, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import AddPaymentModal from '@/app/components/modals/AddPaymentModal';
import PaymentHistoryModal from '@/app/components/modals/PaymentHistoryModal';
import VendorPaymentModal from '@/app/components/modals/VendorPaymentModal';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import { EnterpriseCard, EnterpriseEmptyState, EnterpriseMetric, EnterpriseSection, EnterpriseTable, Column } from '@/app/components/ui-enterprise';
import { exportToCsv } from '@/app/services/export.service';
import { useERPStore } from '@/store/erpStore';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useDeleteInvoiceMutation, useInvoicesQuery } from '@/services/queries/useDebts';

import FinancialTracePanel from '@/app/components/accounting/FinancialTracePanel';

export default function DebtPage() {
  const [traceInvoiceId, setTraceInvoiceId] = useState<string | null>(null);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoicesQuery(currentProjectId);
  const { data: costs = [], isLoading: isLoadingCosts } = useCostsQuery(currentProjectId);
  const { mutate: deleteInvoice } = useDeleteInvoiceMutation(currentProjectId);

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCost, setSelectedCost] = useState<any | null>(null);

  const unpaidCosts = useMemo(() => costs.filter(cost => cost.status === 'unpaid'), [costs]);

  const debtTotals = useMemo(() => {
    const now = new Date();
    return invoices.reduce(
      (acc, invoice) => {
        const amount = Number(invoice.amount || 0);
        const paid = Number(invoice.paidAmount || 0);
        const remaining = Number(invoice.remainingAmount || 0);
        acc.totalReceivable += amount;
        acc.totalPaid += paid;
        acc.totalRemaining += remaining;

        if (remaining > 0) {
          const due = invoice.dueDate ? new Date(invoice.dueDate) : new Date(invoice.issuedDate);
          if (!invoice.dueDate) due.setDate(due.getDate() + 30);
          if (now > due) acc.totalOverdue += remaining;
        }
        return acc;
      },
      { totalReceivable: 0, totalPaid: 0, totalRemaining: 0, totalOverdue: 0 },
    );
  }, [invoices]);

  const totalPayable = useMemo(() => unpaidCosts.reduce((sum, cost) => sum + Number(cost.amount || 0), 0), [unpaidCosts]);

  const invoiceColumns: Column<any>[] = [
    {
      header: 'Mã HĐ',
      accessor: invoice => (
        <button onClick={() => setHistoryInvoice(invoice.id)} className="font-mono font-bold text-[var(--text-accent)] hover:underline">
          {invoice.id.substring(0, 8).toUpperCase()}
        </button>
      ),
      align: 'center',
      width: '100px',
    },
    { header: 'Ngày phát hành', accessor: invoice => formatDate(invoice.issuedDate), align: 'center', width: '128px' },
    { header: 'Tổng tiền', accessor: invoice => formatVnd(invoice.amount), align: 'right', width: '140px' },
    { header: 'Đã thu', accessor: invoice => <span className="text-emerald-500">{formatVnd(invoice.paidAmount)}</span>, align: 'right', width: '140px' },
    {
      header: 'Còn nợ',
      accessor: invoice => {
        const isOverdue = Number(invoice.remainingAmount || 0) > 0 && invoice.dueDate && new Date() > new Date(invoice.dueDate);
        return <span className={isOverdue ? 'text-rose-500 font-bold' : 'text-amber-500 font-bold'}>{formatVnd(invoice.remainingAmount)}</span>;
      },
      align: 'right',
      width: '140px',
    },
    {
      header: 'Tình trạng',
      accessor: invoice => {
        const paid = Number(invoice.remainingAmount || 0) === 0;
        const overdue = !paid && invoice.dueDate && new Date() > new Date(invoice.dueDate);
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${paid ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : overdue ? 'bg-rose-500/10 text-rose-500 ring-1 ring-rose-500/30' : 'bg-blue-500/10 text-blue-500 ring-1 ring-blue-500/30'}`}>
            {paid ? 'Hoàn tất' : overdue ? 'Quá hạn' : 'Trong hạn'}
          </span>
        );
      },
      align: 'center',
      width: '120px',
    },
    {
      header: 'Nghiệp vụ',
      accessor: invoice => (
        <div className="flex items-center justify-center gap-2">
          {Number(invoice.remainingAmount || 0) > 0 && (
            <button onClick={() => setSelectedInvoice(invoice.id)} disabled={!!deletingId} className="erp-btn h-7 px-2 text-[10px] bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50">
              Thu tiền
            </button>
          )}
          <button onClick={() => setHistoryInvoice(invoice.id)} className="erp-btn h-7 px-2 text-[10px] border border-[var(--border)] bg-[var(--secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            Lịch sử
          </button>
          <button
            onClick={() => setTraceInvoiceId(invoice.id)}
            className="erp-btn h-7 px-2 text-[10px] border border-blue-500/20 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
          >
            Truy vết
          </button>
          <button
            disabled={!!deletingId || Number(invoice.paidAmount || 0) > 0}
            onClick={() => {
              if (Number(invoice.paidAmount || 0) > 0) return;
              if (window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
                setDeletingId(invoice.id);
                deleteInvoice(invoice.id, { onSettled: () => setDeletingId(null) });
              }
            }}
            className="h-7 w-7 rounded-[var(--radius-sm)] text-rose-500 hover:bg-rose-500/10 disabled:cursor-not-allowed disabled:opacity-30"
            title="Xóa hóa đơn"
          >
            ×
          </button>
        </div>
      ),
      align: 'center',
      width: '180px',
    },
  ];

  const costColumns: Column<any>[] = [
    { header: 'Ngày', accessor: cost => formatDate(cost.date), align: 'center', width: '140px' },
    { header: 'Nhà cung cấp', accessor: cost => cost.supplier || 'Chưa rõ', width: '260px' },
    {
      header: 'Loại',
      accessor: cost => (
        <span className="inline-flex rounded-md border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-muted)]">
          {cost.costType === 'material' ? 'Vật tư' : cost.costType === 'labor' ? 'Nhân công' : 'Dịch vụ'}
        </span>
      ),
      align: 'center',
      width: '140px',
    },
    { header: 'Số tiền', accessor: cost => <span className="text-rose-500 font-bold">{formatVnd(cost.amount)}</span>, align: 'right', width: '160px' },
    {
      header: 'Tình trạng',
      accessor: () => <span className="inline-flex rounded-full bg-rose-500/10 px-2.5 py-1 text-[10px] font-bold uppercase text-rose-500 ring-1 ring-rose-500/30">Chưa trả</span>,
      align: 'center',
      width: '140px',
    },
    {
      header: 'Nghiệp vụ',
      accessor: cost => (
        <button onClick={() => setSelectedCost(cost)} className="erp-btn h-7 px-3 text-[10px] bg-blue-600 text-white hover:bg-blue-500">
          Chi tiền
        </button>
      ),
      align: 'center',
      width: '140px',
    },
  ];

  return (
    <div className="erp-page">
      <Sidebar activeItem="debt" />
      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header />
        <div className="erp-content-container animate-fade-in space-y-6">
          <div className="border-b border-[var(--border)] pb-4">
            <h1 className="text-[20px] font-bold text-[var(--text-primary)]">Công nợ & Thanh toán</h1>
            <p className="mt-1 text-[12px] font-bold uppercase text-[var(--text-tertiary)]">Theo dõi phải thu, phải trả và lịch sử thanh toán</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <EnterpriseMetric title="Công nợ phải thu" value={formatVnd(debtTotals.totalReceivable)} />
            <EnterpriseMetric title="Đã thu" value={formatVnd(debtTotals.totalPaid)} />
            <EnterpriseMetric title="Còn phải thu" value={formatVnd(debtTotals.totalRemaining)} />
            <EnterpriseMetric title="Công nợ phải trả" value={formatVnd(totalPayable)} />
          </div>

          <EnterpriseSection
            title="PHẢI THU"
            subtitle={`${invoices.length} hóa đơn, quá hạn ${formatVnd(debtTotals.totalOverdue)}`}
            actions={
              <button
                onClick={() => exportToCsv('Cong_No_Phai_Thu.csv', invoices)}
                className="h-[36px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)]"
              >
                Xuất CSV
              </button>
            }
          >
            <EnterpriseCard bodyClassName="p-0">
              <EnterpriseTable
                data={invoices}
                columns={invoiceColumns}
                loading={isLoadingInvoices}
                minWidth="948px"
                getRowKey={invoice => invoice.id}
                emptyState={<EnterpriseEmptyState title="Chưa có công nợ phải thu" description="Tạo hóa đơn hoặc ghi nhận doanh thu để theo dõi các khoản phải thu." iconType="debt" />}
                footer={
                  <tr className="h-[40px] font-bold text-[12px] text-[var(--text-primary)]">
                    <td colSpan={2} className="px-4 text-right uppercase text-[var(--text-secondary)]">Tổng phải thu</td>
                    <td className="px-4 text-right tabular-nums font-mono">{formatVnd(debtTotals.totalReceivable)}</td>
                    <td className="px-4 text-right tabular-nums font-mono text-emerald-500">{formatVnd(debtTotals.totalPaid)}</td>
                    <td className="px-4 text-right tabular-nums font-mono text-rose-500">{formatVnd(debtTotals.totalRemaining)}</td>
                    <td colSpan={2} />
                  </tr>
                }
              />
            </EnterpriseCard>
          </EnterpriseSection>

          <EnterpriseSection
            title="PHẢI TRẢ"
            subtitle={`${unpaidCosts.length} khoản chưa thanh toán`}
            actions={
              <button
                onClick={() => exportToCsv('Cong_No_Phai_Tra.csv', unpaidCosts)}
                className="h-[36px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)]"
              >
                Xuất CSV
              </button>
            }
          >
            <EnterpriseCard bodyClassName="p-0">
              <EnterpriseTable
                data={unpaidCosts}
                columns={costColumns}
                loading={isLoadingCosts}
                minWidth="920px"
                getRowKey={cost => cost.id}
                emptyState={<EnterpriseEmptyState title="Chưa có công nợ phải trả" description="Các chi phí chưa thanh toán sẽ xuất hiện tại đây để lập ủy nhiệm chi." iconType="debt" />}
                footer={
                  <tr className="h-[40px] font-bold text-[12px] text-[var(--text-primary)]">
                    <td colSpan={3} className="px-4 text-right uppercase text-[var(--text-secondary)]">Tổng phải trả</td>
                    <td className="px-4 text-right tabular-nums font-mono text-rose-500">{formatVnd(totalPayable)}</td>
                    <td colSpan={2} />
                  </tr>
                }
              />
            </EnterpriseCard>
          </EnterpriseSection>
        </div>

        <AddPaymentModal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} invoiceId={selectedInvoice || undefined} />
        <PaymentHistoryModal isOpen={!!historyInvoice} onClose={() => setHistoryInvoice(null)} invoiceId={historyInvoice || undefined} />
        <VendorPaymentModal isOpen={!!selectedCost} onClose={() => setSelectedCost(null)} cost={selectedCost} />
        <FinancialTracePanel
          type="invoice"
          id={traceInvoiceId || ""}
          isOpen={traceInvoiceId !== null}
          onClose={() => setTraceInvoiceId(null)}
        />
      </main>
    </div>
  );
}
