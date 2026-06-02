'use client';

import { useMemo, useState } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import AddPaymentModal from '@/app/components/modals/AddPaymentModal';
import PaymentHistoryModal from '@/app/components/modals/PaymentHistoryModal';
import VendorPaymentModal from '@/app/components/modals/VendorPaymentModal';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import {
  EnterpriseCard,
  EnterpriseEmptyState,
  EnterpriseMetric,
  EnterpriseSection,
  EnterpriseDataTable,
  EnterpriseColumn,
  EnterpriseActionMenu
} from '@/app/components/ui-enterprise';
import { auditedCsvExport } from '@/app/services/audited-export.service';
import { useERPStore } from '@/store/erpStore';
import { useCostsQuery } from '@/services/queries/useCosts';
import { useDeleteInvoiceMutation, useInvoicesQuery } from '@/services/queries/useDebts';

import FinancialTracePanel from '@/app/components/accounting/FinancialTracePanel';

export default function DebtPage() {
  const [traceInvoiceId, setTraceInvoiceId] = useState<string | null>(null);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const { data: invoices = [], isLoading: isLoadingInvoices } = useInvoicesQuery(currentProjectId);
  const { data: costs = [], isLoading: isLoadingCosts } = useCostsQuery(currentProjectId);
  const { mutate: deleteInvoice } = useDeleteInvoiceMutation(currentProjectId);

  const [selectedInvoice, setSelectedInvoice] = useState<string | null>(null);
  const [historyInvoice, setHistoryInvoice] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedCost, setSelectedCost] = useState<any | null>(null);

  const unpaidCosts = useMemo(() => costs.filter(cost => cost.status === 'unpaid'), [costs]);
  const handleAuditedExport = async (reportType: 'DEBT_RECEIVABLE' | 'DEBT_PAYABLE') => {
    try {
      await auditedCsvExport({ reportType, projectId: currentProjectId, reason: `Xuất báo cáo ${reportType === 'DEBT_RECEIVABLE' ? 'công nợ phải thu' : 'công nợ phải trả'}` });
    } catch (error: any) {
      alert(error.message || 'Không thể xuất báo cáo công nợ.');
    }
  };

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

  const invoiceColumns: EnterpriseColumn<any>[] = [
    {
      key: 'invoiceId',
      header: 'Mã HĐ',
      render: invoice => (
        <button onClick={() => setHistoryInvoice(invoice.id)} className="font-mono font-bold text-[var(--text-accent)] hover:underline cursor-pointer">
          {invoice.id.substring(0, 8).toUpperCase()}
        </button>
      ),
      align: 'center',
      width: '120px',
      minWidth: '100px'
    },
    { 
      key: 'issuedDate',
      header: 'Ngày phát hành', 
      render: invoice => formatDate(invoice.issuedDate), 
      align: 'center', 
      width: '150px', 
      minWidth: '130px' 
    },
    { 
      key: 'amount',
      header: 'Tổng tiền', 
      render: invoice => formatVnd(invoice.amount), 
      align: 'right', 
      width: '170px', 
      minWidth: '150px' 
    },
    { 
      key: 'paidAmount',
      header: 'Đã thu hồi', 
      render: invoice => <span className="text-emerald-500 font-bold">{formatVnd(invoice.paidAmount)}</span>, 
      align: 'right', 
      width: '170px', 
      minWidth: '150px' 
    },
    {
      key: 'remainingAmount',
      header: 'Còn nợ',
      render: invoice => {
        const isOverdue = Number(invoice.remainingAmount || 0) > 0 && invoice.dueDate && new Date() > new Date(invoice.dueDate);
        return <span className={isOverdue ? 'text-rose-500 font-bold' : 'text-amber-500 font-bold'}>{formatVnd(invoice.remainingAmount)}</span>;
      },
      align: 'right',
      width: '170px',
      minWidth: '150px'
    },
    {
      key: 'status',
      header: 'Tình trạng',
      render: invoice => {
        const paid = Number(invoice.remainingAmount || 0) === 0;
        const overdue = !paid && invoice.dueDate && new Date() > new Date(invoice.dueDate);
        return (
          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${
            paid 
              ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' 
              : overdue 
              ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' 
              : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
          }`}>
            {paid ? 'Đã thanh toán' : overdue ? 'Quá hạn' : 'Trong hạn'}
          </span>
        );
      },
      align: 'center',
      width: '150px',
      minWidth: '130px'
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: invoice => {
        const menuActions: any[] = [];
        if (Number(invoice.remainingAmount || 0) > 0) {
          menuActions.push({ label: 'Ghi nhận thu tiền', onClick: () => setSelectedInvoice(invoice.id) });
        }
        menuActions.push({ label: 'Lịch sử thu tiền', onClick: () => setHistoryInvoice(invoice.id) });
        menuActions.push({ label: 'Truy vết định khoản', onClick: () => setTraceInvoiceId(invoice.id) });
        if (Number(invoice.paidAmount || 0) === 0) {
          menuActions.push({
            label: 'Hủy/Xóa hóa đơn',
            onClick: () => {
              if (window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) {
                setDeletingId(invoice.id);
                deleteInvoice(invoice.id, { onSettled: () => setDeletingId(null) });
              }
            },
            variant: 'danger' as const
          });
        }
        return (
          <div className="flex justify-center" onClick={e => e.stopPropagation()}>
            <EnterpriseActionMenu actions={menuActions} />
          </div>
        );
      },
      align: 'center',
      width: '120px',
      minWidth: '110px'
    },
  ];

  const costColumns: EnterpriseColumn<any>[] = [
    { 
      key: 'date',
      header: 'Ngày hạch toán', 
      render: cost => formatDate(cost.date), 
      align: 'center', 
      width: '140px', 
      minWidth: '130px' 
    },
    { 
      key: 'supplier',
      header: 'Nhà cung cấp', 
      render: cost => <span className="font-bold text-[var(--text-primary)]">{cost.supplier || 'Chưa rõ'}</span>, 
      width: '260px', 
      minWidth: '240px' 
    },
    {
      key: 'costType',
      header: 'Loại chi phí',
      render: cost => (
        <span className="inline-flex rounded border border-[var(--border)] bg-[var(--secondary)] px-2 py-0.5 text-[10px] font-bold uppercase text-[var(--text-secondary)]">
          {cost.costType === 'material' ? 'Vật tư' : cost.costType === 'labor' ? 'Nhân công' : 'Dịch vụ'}
        </span>
      ),
      align: 'center',
      width: '150px',
      minWidth: '140px'
    },
    { 
      key: 'amount',
      header: 'Số tiền nợ', 
      render: cost => <span className="text-rose-500 font-bold">{formatVnd(cost.amount)}</span>, 
      align: 'right', 
      width: '170px', 
      minWidth: '160px' 
    },
    {
      key: 'status',
      header: 'Tình trạng',
      render: () => <span className="inline-flex rounded-full bg-rose-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-rose-500 border border-rose-500/20">Chưa trả</span>,
      align: 'center',
      width: '150px',
      minWidth: '140px'
    },
    {
      key: 'actions',
      header: 'Thao tác',
      render: cost => (
        <div className="flex justify-center" onClick={e => e.stopPropagation()}>
          <EnterpriseActionMenu 
            actions={[
              { label: 'Chi tiền thanh toán', onClick: () => setSelectedCost(cost) }
            ]}
          />
        </div>
      ),
      align: 'center',
      width: '120px',
      minWidth: '110px'
    },
  ];

  return (
    <EnterpriseAppShell activeItem="debt">
      <EnterpriseHeader 
        title="Công nợ & Thanh toán" 
        subtitle="Quản lý đồng bộ công nợ phải thu, phải trả và lịch sử dòng tiền định khoản"
      />

      <EnterprisePageContainer>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EnterpriseMetric title="Tổng công nợ phải thu" value={formatVnd(debtTotals.totalReceivable)} />
          <EnterpriseMetric title="Tổng đã thu hồi" value={formatVnd(debtTotals.totalPaid)} />
          <EnterpriseMetric title="Còn lại phải thu" value={formatVnd(debtTotals.totalRemaining)} />
          <EnterpriseMetric title="Tổng công nợ phải trả" value={formatVnd(totalPayable)} />
        </div>

        <EnterpriseSection
          title="Khoản công nợ phải thu (Hóa đơn / Doanh thu)"
          subtitle={`${invoices.length} hóa đơn phát hành, quá hạn ${formatVnd(debtTotals.totalOverdue)}`}
          actions={
            <button
              onClick={() => handleAuditedExport('DEBT_RECEIVABLE')}
              className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer transition-all shadow-sm"
            >
              Xuất dữ liệu
            </button>
          }
        >
          <EnterpriseCard bodyClassName="p-0">
            <EnterpriseDataTable
              data={invoices}
              columns={invoiceColumns}
              loading={isLoadingInvoices}
              minWidth="1050px"
              getRowKey={invoice => invoice.id}
              emptyState={<EnterpriseEmptyState title="Chưa có công nợ phải thu" description="Tạo hóa đơn hoặc ghi nhận doanh thu để theo dõi các khoản phải thu." iconType="debt" />}
              footer={
                <tr className="h-[40px] font-bold text-[12px] text-[var(--text-primary)] bg-[var(--secondary)]">
                  <td colSpan={2} className="px-4 text-right uppercase text-[var(--text-secondary)] font-bold">Tổng phải thu</td>
                  <td className="px-4 text-right tabular-nums font-mono text-[var(--text-primary)]">{formatVnd(debtTotals.totalReceivable)}</td>
                  <td className="px-4 text-right tabular-nums font-mono text-emerald-500">{formatVnd(debtTotals.totalPaid)}</td>
                  <td className="px-4 text-right tabular-nums font-mono text-rose-500">{formatVnd(debtTotals.totalRemaining)}</td>
                  <td colSpan={2} />
                </tr>
              }
            />
          </EnterpriseCard>
        </EnterpriseSection>

        <EnterpriseSection
          title="Khoản công nợ phải trả (Nhà thầu phụ / Nhà cung cấp)"
          subtitle={`${unpaidCosts.length} khoản chi phí chưa thanh toán`}
          actions={
            <button
              onClick={() => handleAuditedExport('DEBT_PAYABLE')}
              className="h-9 rounded-md border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer transition-all shadow-sm"
            >
              Xuất dữ liệu
            </button>
          }
        >
          <EnterpriseCard bodyClassName="p-0">
            <EnterpriseDataTable
              data={unpaidCosts}
              columns={costColumns}
              loading={isLoadingCosts}
              minWidth="990px"
              getRowKey={cost => cost.id}
              emptyState={<EnterpriseEmptyState title="Chưa có công nợ phải trả" description="Các chi phí chưa thanh toán sẽ xuất hiện tại đây để lập ủy nhiệm chi." iconType="debt" />}
              footer={
                <tr className="h-[40px] font-bold text-[12px] text-[var(--text-primary)] bg-[var(--secondary)]">
                  <td colSpan={3} className="px-4 text-right uppercase text-[var(--text-secondary)] font-bold">Tổng phải trả</td>
                  <td className="px-4 text-right tabular-nums font-mono text-rose-500">{formatVnd(totalPayable)}</td>
                  <td colSpan={2} />
                </tr>
              }
            />
          </EnterpriseCard>
        </EnterpriseSection>
      </EnterprisePageContainer>

      <AddPaymentModal isOpen={!!selectedInvoice} onClose={() => setSelectedInvoice(null)} invoiceId={selectedInvoice || undefined} />
      <PaymentHistoryModal isOpen={!!historyInvoice} onClose={() => setHistoryInvoice(null)} invoiceId={historyInvoice || undefined} />
      <VendorPaymentModal isOpen={!!selectedCost} onClose={() => setSelectedCost(null)} cost={selectedCost} />
      <FinancialTracePanel
        type="invoice"
        id={traceInvoiceId || ""}
        isOpen={traceInvoiceId !== null}
        onClose={() => setTraceInvoiceId(null)}
      />
    </EnterpriseAppShell>
  );
}
