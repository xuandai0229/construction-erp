'use client';

import { useMemo, useState } from 'react';
import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';
import AddRevenueModal from '@/app/components/modals/AddRevenueModal';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import {
  EnterpriseColumn,
  EnterpriseDataTable,
  EnterpriseCard,
  EnterpriseEmptyState,
  EnterpriseMetric,
  EnterpriseSection
} from '@/app/components/ui-enterprise';
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

  const columns: EnterpriseColumn<any>[] = [
    {
      key: 'date',
      header: 'Ngày',
      width: '130px',
      align: 'center',
      render: (row) => formatDate(row.date)
    },
    {
      key: 'wbsId',
      header: 'Hạng mục WBS',
      width: '240px',
      render: (row) => getWbsName(row.wbsId)
    },
    {
      key: 'description',
      header: 'Diễn giải',
      minWidth: '320px',
      render: (row) => row.description || '-'
    },
    {
      key: 'net',
      header: 'Trước thuế',
      width: '160px',
      align: 'right',
      render: (row) => <span>{formatVnd(Math.round(Number(row.amount || 0) / 1.1))}</span>
    },
    {
      key: 'vat',
      header: 'VAT',
      width: '140px',
      align: 'right',
      render: (row) => {
        const amount = Number(row.amount || 0);
        return <span>{formatVnd(amount - Math.round(amount / 1.1))}</span>;
      }
    },
    {
      key: 'amount',
      header: 'Tổng doanh thu',
      width: '170px',
      align: 'right',
      render: (row) => <span className="font-bold text-emerald-500">{formatVnd(row.amount)}</span>
    },
    {
      key: 'status',
      header: 'Trạng thái',
      width: '140px',
      align: 'center',
      render: (row) => (
        <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wider ${row.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 ring-1 ring-emerald-500/30' : 'bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/30'}`}>
          {row.status === 'paid' ? 'Đã thu' : 'Chưa thu'}
        </span>
      )
    },
    {
      key: 'action',
      header: 'Nghiệp vụ',
      width: '160px',
      align: 'center',
      render: (row) => (
        <button
          disabled={!!processingId}
          onClick={() => handleToggle(row.id, row.status)}
          className={`text-[12px] font-bold hover:underline disabled:opacity-50 cursor-pointer transition-colors ${row.status === 'paid' ? 'text-rose-500 hover:text-rose-600' : 'text-emerald-500 hover:text-emerald-600'}`}
        >
          {processingId === row.id ? 'Đang xử lý...' : row.status === 'paid' ? 'Hoàn bút toán' : 'Ghi nhận đã thu'}
        </button>
      )
    },
    {
      key: 'trace',
      header: 'Truy vết',
      width: '140px',
      align: 'center',
      render: (row) => row.invoiceId ? (
        <button
          onClick={() => setTraceInvoiceId(row.invoiceId)}
          className="text-[11px] font-black uppercase tracking-wider text-blue-500 underline underline-offset-2 transition-colors hover:text-blue-400 cursor-pointer"
        >
          Xem truy vết
        </button>
      ) : (
        <span className="text-[10px] text-[var(--text-tertiary)] italic">Không có hóa đơn</span>
      )
    }
  ];

  return (
    <EnterpriseAppShell activeItem="revenue">
      <EnterpriseHeader
        title="QUẢN LÝ DOANH THU & NGUỒN THU CÔNG TRÌNH"
        subtitle="Quản lý và theo dõi các khoản thu tiền thầu, nghiệm thu chủ đầu tư và hạch toán dòng tiền vào"
      />
      <AddRevenueModal isOpen={showAddModal} onClose={() => setShowAddModal(false)} />
      <EnterprisePageContainer>
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
          <div>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">Doanh thu dự án</h1>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">Quản lý khoản thu và trạng thái thanh toán từ khách hàng / chủ đầu tư</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => exportToCsv('ERP_Revenue.csv', revenues)}
              className="h-[36px] rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-4 text-[12px] font-bold text-[var(--text-primary)] hover:bg-[var(--muted)] cursor-pointer transition-colors"
            >
              Xuất CSV
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="h-[36px] rounded-[var(--radius-sm)] bg-emerald-600 hover:bg-emerald-500 px-4 text-[12px] font-bold text-white shadow-sm cursor-pointer transition-colors"
            >
              Thêm doanh thu
            </button>
          </div>
        </div>

        {/* Metric panels */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <EnterpriseMetric title="Tổng doanh thu" value={formatVnd(totals.amount)} />
          <EnterpriseMetric title="Đã thu" value={formatVnd(totals.paid)} />
          <EnterpriseMetric title="Chưa thu" value={formatVnd(totals.unpaid)} />
          <EnterpriseMetric title="VAT đầu ra" value={formatVnd(totals.vat)} />
        </div>

        {/* Main EnterpriseDataTable */}
        <EnterpriseSection title="DANH SÁCH CÁC KHOẢN DOANH THU GHI NHẬN" subtitle={`${revenues.length} giao dịch`}>
          <EnterpriseCard bodyClassName="p-0">
            <EnterpriseDataTable
              data={revenues}
              columns={columns}
              loading={isLoadingRevenues}
              minWidth="1480px"
              getRowKey={row => row.id}
              emptyState={
                <EnterpriseEmptyState
                  title="Chưa có khoản doanh thu"
                  description="Ghi nhận doanh thu đầu tiên để theo dõi công nợ phải thu và thuế VAT đầu ra."
                  iconType="report"
                />
              }
              footer={
                <tr className="h-[40px] text-[12px] font-bold text-[var(--text-primary)] bg-[var(--secondary)]">
                  <td colSpan={3} className="px-4 text-right uppercase text-[var(--text-secondary)]">Tổng cộng</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.net)}</td>
                  <td className="px-4 text-right font-mono tabular-nums">{formatVnd(totals.vat)}</td>
                  <td className="px-4 text-right font-mono tabular-nums text-emerald-500">{formatVnd(totals.amount)}</td>
                  <td colSpan={3} />
                </tr>
              }
            />
          </EnterpriseCard>
        </EnterpriseSection>

        {/* Financial trace panel */}
        <FinancialTracePanel
          type="invoice"
          id={traceInvoiceId || ""}
          isOpen={traceInvoiceId !== null}
          onClose={() => setTraceInvoiceId(null)}
        />
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}
