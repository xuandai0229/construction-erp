'use client';

import { DashboardData, formatVnd } from './dashboard-data';

export default function DebtPanel({ data }: { data: DashboardData }) {
  return (
    <div className="erp-card flex flex-col h-full">
      <div className="erp-panel-header">
        <h3 className="t-section-title uppercase text-[12px] text-[var(--text-secondary)] tracking-wider">Công nợ</h3>
      </div>
      <div className="erp-card-pad space-y-4">
        {/* Receivable */}
        <div>
          <div className="flex justify-between items-center mb-2">
             <span className="text-[12px] font-bold text-[var(--brand)] uppercase">Phải thu (Khách hàng)</span>
             <span className="text-[14px] font-bold text-[var(--text-primary)]">{formatVnd(data.receivable.total)}</span>
          </div>
          <div className="space-y-1.5">
            <DebtRow label="Tổng phải thu" val={data.receivable.total} color="bg-[var(--brand)]" />
            <DebtRow label="Đã thu" val={data.receivable.paid} color="bg-[var(--success)]" />
            <DebtRow label="Còn lại" val={data.receivable.total - data.receivable.paid} color="bg-[var(--warning)]" />
            <DebtRow label="Quá hạn" val={850000000} color="bg-[var(--danger)]" />
          </div>
        </div>

        {/* Payable */}
        <div className="pt-4 border-t border-[var(--border)]">
          <div className="flex justify-between items-center mb-2">
             <span className="text-[12px] font-bold text-[var(--danger)] uppercase">Phải trả (Nhà cung cấp)</span>
             <span className="text-[14px] font-bold text-[var(--text-primary)]">{formatVnd(data.payable.total)}</span>
          </div>
          <div className="space-y-1.5">
            <DebtRow label="Tổng phải trả" val={data.payable.total} color="bg-[var(--danger)]" />
            <DebtRow label="Đã trả" val={data.payable.paid} color="bg-[var(--brand)]" />
            <DebtRow label="Còn lại" val={data.payable.total - data.payable.paid} color="bg-[var(--warning)]" />
            <DebtRow label="Quá hạn" val={300000000} color="bg-[var(--danger)]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DebtRow({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
       <div className={`h-2 w-2 rounded-full ${color}`} />
       <span className="text-[12px] font-medium text-[var(--text-secondary)] flex-1">{label}</span>
       <span className="text-[12px] font-bold text-[var(--text-primary)] tabular-nums">{formatVnd(val)}</span>
    </div>
  );
}
