'use client';

/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { formatDate, formatVnd } from '@/app/components/dashboard-data';

import EnterpriseAppShell from '@/app/components/layout/EnterpriseAppShell';
import EnterpriseHeader from '@/app/components/layout/EnterpriseHeader';
import EnterprisePageContainer from '@/app/components/layout/EnterprisePageContainer';

import {
  EnterpriseColumn,
  EnterpriseDataTable,
  EnterpriseCard,
  EnterpriseEmptyState,
  EnterpriseSection
} from '@/app/components/ui-enterprise';

function MoneyCard({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <EnterpriseCard bodyClassName="p-4">
      <div className="text-[10px] font-black uppercase tracking-widest text-[var(--text-muted)]">{label}</div>
      <div className={`mt-2 text-[18px] font-black tabular-nums font-mono ${danger ? 'text-rose-500' : 'text-[var(--text-primary)]'}`}>{formatVnd(value)}</div>
    </EnterpriseCard>
  );
}

function DataTable({ title, rows, columns }: { title: string; rows: any[]; columns: { key: string; label: string; money?: boolean; date?: boolean }[] }) {
  const tableColumns: EnterpriseColumn<any>[] = columns.map(col => ({
    key: col.key,
    header: col.label,
    render: (row) => col.money ? formatVnd(Number(row[col.key] || 0)) : col.date ? formatDate(row[col.key]) : row[col.key] || '',
    align: col.money ? 'right' : col.date ? 'center' : 'left',
    width: col.money ? '160px' : col.date ? '140px' : '220px',
  }));

  return (
    <EnterpriseCard title={title} bodyClassName="p-0">
      <EnterpriseDataTable
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
      <EnterpriseAppShell activeItem="vouchers">
        <EnterpriseHeader title="ĐANG TẢI CHI TIẾT HỢP ĐỒNG..." subtitle="Hệ thống đang tải số liệu công nợ hợp đồng" />
        <EnterprisePageContainer>
          <div className="text-[13px] font-bold text-[var(--text-muted)] p-6 bg-[var(--card)] rounded-xl border border-[var(--border)] animate-pulse">
            Đang tải dữ liệu hạch toán...
          </div>
        </EnterprisePageContainer>
      </EnterpriseAppShell>
    );
  }

  const red = contract.warnings.filter((warning: any) => warning.severity === 'RED');
  const yellow = contract.warnings.filter((warning: any) => warning.severity === 'YELLOW');

  return (
    <EnterpriseAppShell activeItem="vouchers">
      <EnterpriseHeader
        title={`HỒ SƠ HỢP ĐỒNG: ${contract.contractCode}`}
        subtitle={`${contract.title}`}
      />
      <EnterprisePageContainer>
        {/* Navigation & Status bar */}
        <div className="flex items-end justify-between gap-3 pb-2">
          <div>
            <button
              onClick={() => router.push('/accounting')}
              className="mb-2 text-[11px] font-bold uppercase tracking-widest text-blue-500 hover:text-blue-400 cursor-pointer flex items-center gap-1 transition-colors"
            >
              <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M19 12H5m7 7-7-7 7-7"/>
              </svg>
              Quay lại tổng hợp công nợ
            </button>
            <h1 className="text-sm font-bold tracking-tight text-[var(--text-primary)]">
              {contract.projectName}
            </h1>
            <p className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wide mt-1">
              Nhà cung cấp: {contract.supplierCode} - {contract.supplierName}
            </p>
          </div>
          <div className="flex gap-2 select-none">
            {red.length > 0 && <span className="rounded-md bg-rose-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-rose-500 ring-1 ring-rose-500/20">{red.length} đỏ</span>}
            {yellow.length > 0 && <span className="rounded-md bg-amber-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-amber-500 ring-1 ring-amber-500/20">{yellow.length} vàng</span>}
            {contract.warnings.length === 0 && <span className="rounded-md bg-emerald-500/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-emerald-500 ring-1 ring-emerald-500/20">An toàn</span>}
          </div>
        </div>

        {/* MoneyCard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <MoneyCard label="Giá trị hợp đồng" value={contract.contractValue} />
          <MoneyCard label="Tổng nghiệm thu" value={contract.totalAcceptance} danger={contract.totalAcceptance > contract.contractValue} />
          <MoneyCard label="Tổng hóa đơn" value={contract.totalInvoice} danger={contract.totalInvoice > contract.totalAcceptance} />
          <MoneyCard label="Đã tạm ứng/thanh toán" value={contract.totalPayment} danger={contract.totalPayment > contract.totalInvoice || contract.totalPayment > contract.totalAcceptance} />
          <MoneyCard label="Công nợ còn phải trả" value={contract.debt} danger={contract.debt < 0} />
        </div>

        {/* Audit warnings section */}
        {contract.warnings.length > 0 && (
          <EnterpriseSection title="PHÁT HIỆN SAI LỆCH CÔNG NỢ & DÒNG TIỀN">
            <div className="rounded-lg border border-rose-500/20 bg-rose-500/5 overflow-hidden">
              <div className="border-b border-rose-500/20 px-4 py-3 bg-rose-500/10">
                <h2 className="text-[11px] font-black uppercase tracking-widest text-rose-500">Cảnh báo sai lệch tự động</h2>
              </div>
              <div className="divide-y divide-rose-500/15">
                {contract.warnings.map((warning: any) => (
                  <div key={warning.id} className="flex items-center justify-between gap-4 px-4 py-3 hover:bg-rose-500/10 transition-colors">
                    <div>
                      <div className={`text-[10px] font-black uppercase tracking-widest ${warning.severity === 'RED' ? 'text-rose-500' : 'text-amber-500'}`}>{warning.severity}</div>
                      <div className="text-[12px] font-bold text-[var(--text-primary)]">{warning.reason}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{warning.documentType}: {warning.documentId} | Trạng thái: {warning.status}</div>
                    </div>
                    <div className="text-right font-black font-mono tabular-nums text-rose-500">{formatVnd(Number(warning.amount || 0))}</div>
                  </div>
                ))}
              </div>
            </div>
          </EnterpriseSection>
        )}

        {/* Dynamic sub-tables */}
        <DataTable
          title="Danh sách nghiệm thu hoàn thành"
          rows={contract.acceptances}
          columns={[
            { key: 'acceptanceNumber', label: 'Số nghiệm thu' },
            { key: 'date', label: 'Ngày BB', date: true },
            { key: 'amount', label: 'Giá trị nghiệm thu', money: true },
            { key: 'note', label: 'Ghi chú' },
          ]}
        />
        
        <DataTable
          title="Danh sách hóa đơn VAT liên quan"
          rows={contract.invoices}
          columns={[
            { key: 'invoiceNumber', label: 'Số hóa đơn' },
            { key: 'issuedDate', label: 'Ngày phát hành', date: true },
            { key: 'dueDate', label: 'Hạn thanh toán', date: true },
            { key: 'amount', label: 'Giá trị trước thuế', money: true },
            { key: 'paidAmount', label: 'Đã thanh toán', money: true },
            { key: 'remainingAmount', label: 'Còn lại', money: true },
          ]}
        />
        
        <DataTable
          title="Danh sách chứng từ tạm ứng & thanh toán"
          rows={contract.payments}
          columns={[
            { key: 'date', label: 'Ngày hạch toán', date: true },
            { key: 'invoiceId', label: 'Hóa đơn liên quan' },
            { key: 'amount', label: 'Số tiền chi', money: true },
            { key: 'description', label: 'Diễn giải dòng tiền' },
          ]}
        />
        
        <DataTable
          title="Kế hoạch thanh toán công nợ"
          rows={contract.paymentPlans}
          columns={[
            { key: 'dueDate', label: 'Ngày dự kiến chi', date: true },
            { key: 'amount', label: 'Số tiền dự kiến', money: true },
            { key: 'paymentMethod', label: 'Hình thức chi' },
            { key: 'status', label: 'Trạng thái' },
            { key: 'note', label: 'Ghi chú bổ sung' },
          ]}
        />
        
        <DataTable
          title="Bảng kiểm tra hồ sơ hoàn công (Document Checklist)"
          rows={contract.documentChecklist}
          columns={[
            { key: 'name', label: 'Tên hồ sơ / Biên bản' },
            { key: 'status', label: 'Trạng thái duyệt' },
            { key: 'note', label: 'Ghi chú hồ sơ' },
          ]}
        />
      </EnterprisePageContainer>
    </EnterpriseAppShell>
  );
}
