'use client';

import { useMemo, useState } from 'react';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import { Column, EnterpriseCard, EnterpriseEmptyState, EnterpriseMetric, EnterpriseSection, EnterpriseTable } from '@/app/components/ui-enterprise';
import { exportToCsv } from '@/app/services/export.service';
import { RevenueStatus } from '@/app/types';
import { useERPStore } from '@/store/erpStore';
import { useRevenuesQuery, useUpdateRevenueMutation } from '@/services/queries/useRevenues';
import { useWBSQuery } from '@/services/queries/useWBS';

import FinancialTracePanel from '@/app/components/accounting/FinancialTracePanel';

export default function RevenueListPage() {
  const [traceInvoiceId, setTraceInvoiceId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const currentProjectId = useERPStore(state => state.currentProjectId);
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);

  const { data: revenues = [], isLoading: isLoadingRevenues } = useRevenuesQuery(currentProjectId);
  const { data: wbsData } = useWBSQuery(currentProjectId);
  const { mutate: updateRevenue } = useUpdateRevenueMutation(currentProjectId);
  const wbs = wbsData?.flat || [];

  const getWbsName = (id: string) => wbs.find(item => item.id === id)?.name || '-';

  const totals = useMemo(() => {
    return revenues.reduce(
      (acc, revenue) => {
        const amount = Number(revenue.amount || 0);
        const net = Math.round(amount / 1.1);
        acc.net += net;
        acc.vat += amount - net;
        acc.amount += amount;
        if (revenue.status === 'paid') acc.paid += amount;
        else acc.unpaid += amount;
        return acc;
      },
      { net: 0, vat: 0, amount: 0, paid: 0, unpaid: 0 },
    );
  }, [revenues]);

  const handleToggle = (id: string, current: RevenueStatus) => {
    if (processingId) return;
    const actionLabel = current === 'paid' ? 'Hoàn bút toán' : 'Ghi nhận đã thu';
    if (!confirm(`Bạn có chắc chắn muốn thực hiện: ${actionLabel}?`)) return;

    setProcessingId(id);
    updateRevenue(
      { id, updates: { status: current === 'paid' ? 'unpaid' : 'paid' } },
      { onSettled: () => setProcessingId(null) },
    );
  };

  const columns: Column<any>[] = [
    { header: 'Ngày', accessor: row => formatDate(row.date), align: 'center', width: '128px' },
    { header: 'Hạng mục WBS', accessor: row => getWbsName(row.wbsId), width: '240px' },
    { header: 'Diễn giải', accessor: row => row.description || '-', width: '320px' },
    {
      header: 'Trước thuế',
      accessor: row => formatVnd(Math.round(Number(row.amount || 0) / 1.1)),
      align: 'right',
      width: '150px',
    },
    {
      header: 'VAT',
      accessor: row => {
        const amount = Number(row.amount || 0);
        return formatVnd(amount - Math.round(amount / 1.1));
      },
      align: 'right',
      width: '140px',
    },
    { header: 'Tổng doanh thu', accessor: row => <span className="font-bold text-emerald-500">{formatVnd(row.amount)}</span>, align: 'right', width: '170px' },
    {
      header: 'Trạng thái',
      accessor: row => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${row.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30'}`}>
          {row.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
        </span>
      ),
      align: 'center',
      width: '140px',
    },
    {
      header: 'Nghiệp vụ',
      accessor: row => (
        <button
          disabled={!!processingId}
          onClick={() => handleToggle(row.id, row.status)}
          className={`text-[12px] font-bold hover:underline disabled:opacity-50 ${row.status === 'paid' ? 'text-rose-500' : 'text-emerald-500'}`}
        >
          {processingId === row.id ? 'Đang xử lý...' : row.status === 'paid' ? 'Hoàn bút toán' : 'Ghi nhận đã thu'}
        </button>
      ),
      align: 'center',
      width: '160px',
    },
    {
      header: 'Truy vết',
      accessor: row => row.invoiceId ? (
        <button
          onClick={() => setTraceInvoiceId(row.invoiceId)}
          className="text-[11px] font-black uppercase tracking-wider text-blue-500 underline underline-offset-2 transition-colors hover:text-blue-400"
        >
          Xem truy vết
        </button>
      ) : (
        <span className="text-[10px] text-[var(--text-tertiary)] italic">Không có hóa đơn</span>
      ),
      align: 'center',
      width: '140px',
    },
  ];

  return (
    <>
      <AddRevenueModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <div className="erp-page">
        <Sidebar activeItem="revenue" />
        <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
          <Header />
          <div className="erp-content-container animate-fade-in space-y-6">
            <div className="flex flex-col gap-4 border-b border-[var(--border)] pb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h1 className="text-[20px] font-bold text-[var(--text-primary)]">Doanh thu</h1>
                <p className="mt-1 text-[12px] font-bold uppercase text-[var(--text-tertiary)]">Quản lý khoản thu và trạng thái thanh toán</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => exportToCsv('ERP_Revenue.csv', revenues)}
                  className="h-[36px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)]"
                >
                  Xuất CSV
                </button>
                <button onClick={() => setShowAddModal(true)} className="h-[36px] rounded-[var(--radius-sm)] bg-emerald-600 px-4 text-[12px] font-bold text-white hover:bg-emerald-500">
                  Thêm doanh thu
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <EnterpriseMetric title="Tổng doanh thu" value={formatVnd(totals.amount)} />
              <EnterpriseMetric title="Đã thu" value={formatVnd(totals.paid)} />
              <EnterpriseMetric title="Chưa thu" value={formatVnd(totals.unpaid)} />
              <EnterpriseMetric title="VAT đầu ra" value={formatVnd(totals.vat)} />
            </div>

            <EnterpriseSection title="BẢNG DOANH THU" subtitle={`${revenues.length} giao dịch`}>
              <EnterpriseCard bodyClassName="p-0">
                <EnterpriseTable
                  data={revenues}
                  columns={columns}
                  loading={isLoadingRevenues}
                  minWidth="1448px"
                  getRowKey={row => row.id}
                  emptyState={<EnterpriseEmptyState title="Chưa có doanh thu" description="Ghi nhận doanh thu đầu tiên để theo dõi công nợ phải thu và VAT đầu ra." iconType="report" />}
                  footer={
                    <tr className="h-[40px] text-[12px] font-bold text-[var(--text-primary)]">
                      <td colSpan={3} className="px-4 text-right uppercase text-[var(--text-secondary)]">Tổng cộng</td>
                      <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.net)}</td>
                      <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.vat)}</td>
                      <td className="px-4 text-right font-mono tabular-nums text-emerald-500">{formatVnd(totals.amount)}</td>
                      <td colSpan={2} />
                    </tr>
                  }
                />
              </EnterpriseCard>
            </EnterpriseSection>
          </div>
          <FinancialTracePanel
            type="invoice"
            id={traceInvoiceId || ""}
            isOpen={traceInvoiceId !== null}
            onClose={() => setTraceInvoiceId(null)}
          />
        </main>
      </div>
    </>
  );
}
