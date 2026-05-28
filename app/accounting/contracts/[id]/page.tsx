'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Sidebar from '@/app/components/Sidebar';
import Header from '@/app/components/Header';
import { useERPStore } from '@/store/erpStore';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';
import { Column, EnterpriseCard, EnterpriseEmptyState, EnterpriseTable } from '@/app/components/ui-enterprise';
function MoneyCard({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <EnterpriseCard bodyClassName="p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
      <div className={`mt-2 text-[18px] font-black tabular-nums ${danger ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>{formatVnd(value)}</div>
    </EnterpriseCard>
  );
}

function DataTable({ title, rows, columns }: { title: string; rows: any[]; columns: { key: string; label: string; money?: boolean; date?: boolean }[] }) {
  const tableColumns: Column<any>[] = columns.map(col => ({
    header: col.label,
    accessor: row => col.money ? formatVnd(Number(row[col.key] || 0)) : col.date ? formatDate(row[col.key]) : row[col.key] || '',
    align: col.money ? 'right' : col.date ? 'center' : 'left',
    width: col.money ? '160px' : col.date ? '140px' : '220px',
  }));

  return (
    <EnterpriseCard title={title} bodyClassName="p-0">
      <EnterpriseTable
        data={rows}
        columns={tableColumns}
        minWidth={`${Math.max(720, columns.length * 150)}px`}
        getRowKey={(row, index) => row.id || index}
        emptyState={<EnterpriseEmptyState title="Chưa có giao dịch" description="Các phát sinh của hợp đồng sẽ hiển thị tại đây khi được ghi nhận." iconType="voucher" />}
      />
    </EnterpriseCard>
  );
}

export default function ContractAccountingDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const sidebarCollapsed = useERPStore(state => state.sidebarCollapsed);
  const [contract, setContract] = useState<any>(null);

  useEffect(() => {
    if (!params.id) return;
    fetch(`/api/accounting-core?action=contract&contractId=${params.id}`)
      .then(res => res.json())
      .then(json => {
        if (json.success) setContract(json.data);
      });
  }, [params.id]);

  if (!contract) {
    return (
      <div className="erp-page">
        <Sidebar activeItem="accounting" />
        <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
          <Header />
          <div className="erp-content-container text-[13px] font-bold text-[var(--text-muted)]">Đang tải chi tiết hợp đồng...</div>
        </main>
      </div>
    );
  }

  const red = contract.warnings.filter((warning: any) => warning.severity === 'RED');
  const yellow = contract.warnings.filter((warning: any) => warning.severity === 'YELLOW');

  return (
    <div className="erp-page">
      <Sidebar activeItem="accounting" />
      <main className={`erp-page-main ${sidebarCollapsed ? 'with-sidebar-collapsed' : 'with-sidebar-expanded'}`}>
        <Header />
        <div className="erp-content-container space-y-5">
          <div className="flex items-end justify-between gap-3">
            <div className="accent-line">
              <button onClick={() => router.push('/accounting')} className="mb-2 text-[11px] font-bold uppercase tracking-widest text-blue-500">Quay lại tổng hợp</button>
              <h1 className="erp-section-title">{contract.contractCode} - {contract.title}</h1>
              <p className="erp-section-subtitle">{contract.projectName} | {contract.supplierCode} - {contract.supplierName}</p>
            </div>
            <div className="flex gap-2">
              {red.length > 0 && <span className="rounded-md bg-rose-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-rose-500">{red.length} đỏ</span>}
              {yellow.length > 0 && <span className="rounded-md bg-amber-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-amber-500">{yellow.length} vàng</span>}
              {contract.warnings.length === 0 && <span className="rounded-md bg-emerald-500/10 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-emerald-500">Xanh</span>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <MoneyCard label="Giá trị hợp đồng" value={contract.contractValue} />
            <MoneyCard label="Tổng nghiệm thu" value={contract.totalAcceptance} danger={contract.totalAcceptance > contract.contractValue} />
            <MoneyCard label="Tổng hóa đơn" value={contract.totalInvoice} danger={contract.totalInvoice > contract.totalAcceptance} />
            <MoneyCard label="Đã tạm ứng/thanh toán" value={contract.totalPayment} danger={contract.totalPayment > contract.totalInvoice || contract.totalPayment > contract.totalAcceptance} />
            <MoneyCard label="Công nợ còn phải thanh toán" value={contract.debt} danger={contract.debt < 0} />
          </div>

          {contract.warnings.length > 0 && (
            <section className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              <div className="border-b border-[var(--border)] px-4 py-3">
                <h2 className="text-[12px] font-black uppercase tracking-widest">Cảnh báo đỏ/vàng</h2>
              </div>
              <div className="divide-y divide-[var(--border)]">
                {contract.warnings.map((warning: any) => (
                  <div key={warning.id} className="flex items-center justify-between gap-4 px-4 py-3">
                    <div>
                      <div className={`text-[11px] font-black uppercase tracking-widest ${warning.severity === 'RED' ? 'text-rose-500' : 'text-amber-500'}`}>{warning.severity}</div>
                      <div className="text-[13px] font-bold">{warning.reason}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">{warning.documentType}: {warning.documentId} | Trạng thái xử lý: {warning.status}</div>
                    </div>
                    <div className="text-right font-black tabular-nums">{formatVnd(Number(warning.amount || 0))}</div>
                  </div>
                ))}
              </div>
            </section>
          )}

          <DataTable
            title="Danh sách nghiệm thu"
            rows={contract.acceptances}
            columns={[
              { key: 'acceptanceNumber', label: 'Số nghiệm thu' },
              { key: 'date', label: 'Ngày', date: true },
              { key: 'amount', label: 'Giá trị', money: true },
              { key: 'note', label: 'Ghi chú' },
            ]}
          />
          <DataTable
            title="Danh sách hóa đơn"
            rows={contract.invoices}
            columns={[
              { key: 'invoiceNumber', label: 'Số hóa đơn' },
              { key: 'issuedDate', label: 'Ngày phát hành', date: true },
              { key: 'dueDate', label: 'Hạn thanh toán', date: true },
              { key: 'amount', label: 'Giá trị', money: true },
              { key: 'paidAmount', label: 'Đã thanh toán', money: true },
              { key: 'remainingAmount', label: 'Còn lại', money: true },
            ]}
          />
          <DataTable
            title="Danh sách tạm ứng/thanh toán"
            rows={contract.payments}
            columns={[
              { key: 'date', label: 'Ngày', date: true },
              { key: 'invoiceId', label: 'Hóa đơn liên quan' },
              { key: 'amount', label: 'Số tiền', money: true },
              { key: 'description', label: 'Diễn giải' },
            ]}
          />
          <DataTable
            title="Kế hoạch thanh toán"
            rows={contract.paymentPlans}
            columns={[
              { key: 'dueDate', label: 'Ngày dự kiến', date: true },
              { key: 'amount', label: 'Số tiền dự kiến', money: true },
              { key: 'paymentMethod', label: 'Hình thức' },
              { key: 'status', label: 'Trạng thái' },
              { key: 'note', label: 'Ghi chú' },
            ]}
          />
          <DataTable
            title="Hồ sơ còn thiếu"
            rows={contract.documentChecklist}
            columns={[
              { key: 'name', label: 'Hồ sơ' },
              { key: 'status', label: 'Trạng thái' },
              { key: 'note', label: 'Ghi chú' },
            ]}
          />
        </div>
      </main>
    </div>
  );
}
