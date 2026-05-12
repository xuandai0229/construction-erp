'use client';

import { DebtSummary, formatVnd } from './dashboard-data';

export function DebtPanel({ receivable, payable }: { receivable: DebtSummary, payable: DebtSummary }) {
  const receivablePct = receivable.total > 0 ? (receivable.paid / receivable.total) * 100 : 0;
  const payablePct    = payable.total    > 0 ? (payable.paid    / payable.total)    * 100 : 0;

  return (
    <section className="space-y-4">
      {/* Receivable */}
      <div className="card-elevation p-5">
        <div className="accent-line mb-5">
          <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.18em]">Khoản phải thu</h3>
          <p className="text-[9.5px] font-bold text-[var(--text-muted)] tracking-wider mt-0.5">Công nợ phải thu khách hàng</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tổng hóa đơn</span>
            <span className="text-[13px] font-black text-[var(--text-primary)] tabular-nums">{formatVnd(receivable.total)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--secondary)] overflow-hidden border border-[var(--border)]">
            <div className="h-full rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.4)] transition-all duration-700" style={{ width: `${Math.min(100, receivablePct)}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Đã thu</div>
              <div className="text-[12px] font-bold text-blue-500 tabular-nums">{formatVnd(receivable.paid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Còn lại</div>
              <div className="text-[12px] font-bold text-[var(--text-secondary)] tabular-nums">{formatVnd(receivable.remaining)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payable */}
      <div className="card-elevation p-5">
        <div className="accent-line mb-5" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
          <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.18em]">Khoản phải trả</h3>
          <p className="text-[9.5px] font-bold text-[var(--text-muted)] tracking-wider mt-0.5">Công nợ phải trả nhà cung cấp</p>
        </div>

        <div className="space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase tracking-wider">Tổng công nợ</span>
            <span className="text-[13px] font-black text-[var(--text-primary)] tabular-nums">{formatVnd(payable.total)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--secondary)] overflow-hidden border border-[var(--border)]">
            <div className="h-full rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.4)] transition-all duration-700" style={{ width: `${Math.min(100, payablePct)}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Đã trả</div>
              <div className="text-[12px] font-bold text-amber-500 tabular-nums">{formatVnd(payable.paid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-widest">Quá hạn</div>
              <div className="text-[12px] font-bold text-rose-500 tabular-nums">{formatVnd(payable.overdue)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfitPanel({ revenue, cost, margin }: { revenue: number; cost: number; margin: number }) {
  const profit    = revenue - cost;
  const profitPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const positive  = profit >= 0;

  return (
    <section className="card-elevation p-5">
      <div className="accent-line mb-5">
        <h3 className="text-[11px] font-black text-[var(--text-primary)] uppercase tracking-[0.18em]">Hiệu quả kinh doanh</h3>
        <p className="text-[9.5px] font-bold text-[var(--text-muted)] tracking-wider mt-0.5">Chỉ số hiệu suất dự án</p>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-[9.5px] font-black text-[var(--text-muted)] uppercase tracking-widest mb-1">Lợi nhuận gộp</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-2xl font-black tabular-nums tracking-tight ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {positive ? '+' : ''}{formatVnd(profit)}
            </span>
            <span className="text-[10px] font-bold text-[var(--text-muted)] uppercase">VNĐ</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--secondary)] border border-[var(--border)] p-3.5">
            <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tỷ suất LN</div>
            <div className={`text-[18px] font-black tabular-nums ${profitPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-xl bg-[var(--secondary)] border border-[var(--border)] p-3.5">
            <div className="text-[9px] font-black text-[var(--text-muted)] uppercase tracking-wider mb-1.5">Tiến độ</div>
            <div className="text-[18px] font-black text-blue-500 tabular-nums">{margin.toFixed(1)}%</div>
          </div>
        </div>
        <button className="w-full erp-btn bg-blue-600 text-white py-2.5 hover:bg-blue-500 shadow-lg shadow-blue-600/20">
          Phân tích AI tài chính
        </button>
      </div>
    </section>
  );
}
