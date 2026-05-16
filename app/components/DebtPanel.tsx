'use client';

import { DebtSummary, formatVnd } from './dashboard-data';

export function DebtPanel({ receivable, payable }: { receivable: DebtSummary, payable: DebtSummary }) {
  const receivablePct = receivable.total > 0 ? (receivable.paid / receivable.total) * 100 : 0;
  const payablePct = payable.total > 0 ? (payable.paid / payable.total) * 100 : 0;

  return (
    <section className="space-y-5">
      {/* Receivable */}
      <div className="group cursor-default">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-3 bg-blue-500 rounded-full" />
          <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.15em]">Công nợ Phải thu (A)</h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[9.5px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Tổng giá trị hóa đơn thu</span>
            <span className="text-[12.5px] font-black text-[var(--text-primary)] tabular-nums">{formatVnd(receivable.total)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--secondary)] overflow-hidden border border-[var(--border)]/10">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, receivablePct)}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8.5px] font-black text-[var(--text-tertiary)] uppercase tracking-tight">Đã thu</div>
              <div className="text-[11.5px] font-black text-emerald-500 tabular-nums">{formatVnd(receivable.paid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[8.5px] font-black text-[var(--text-tertiary)] uppercase tracking-tight">Còn phải thu</div>
              <div className="text-[11.5px] font-black text-[var(--text-secondary)] tabular-nums">{formatVnd(receivable.remaining)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-[var(--divider)]" />

      {/* Payable */}
      <div className="group cursor-default">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1 h-3 bg-amber-500 rounded-full" />
          <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.15em]">Công nợ Phải trả (B)</h3>
        </div>

        <div className="space-y-2.5">
          <div className="flex items-baseline justify-between">
            <span className="text-[9.5px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider">Tổng nợ phải trả</span>
            <span className="text-[12.5px] font-black text-[var(--text-primary)] tabular-nums">{formatVnd(payable.total)}</span>
          </div>
          <div className="h-1.5 w-full rounded-full bg-[var(--secondary)] overflow-hidden border border-[var(--border)]/10">
            <div className="h-full rounded-full bg-amber-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min(100, payablePct)}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8.5px] font-bold text-[var(--text-tertiary)] uppercase tracking-tight">Đã thanh toán</div>
              <div className="text-[11.5px] font-black text-amber-500 tabular-nums">{formatVnd(payable.paid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[8.5px] font-bold text-rose-400 uppercase tracking-tight">Quá hạn thanh toán</div>
              <div className="text-[11.5px] font-black text-rose-500 tabular-nums">{formatVnd(payable.overdue)}</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProfitPanel({ revenue, cost, margin }: { revenue: number; cost: number; margin: number }) {
  const profit = revenue - cost;
  const profitPct = revenue > 0 ? (profit / revenue) * 100 : 0;
  const positive = profit >= 0;

  return (
    <section className="group cursor-default">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-1 h-3 bg-emerald-500 rounded-full" />
        <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-[0.15em]">Hiệu quả & Lợi nhuận dự án</h3>
      </div>

      <div className="space-y-5">
        <div>
          <div className="text-[9.5px] font-bold text-[var(--text-tertiary)] uppercase tracking-wider mb-1.5">Lợi nhuận gộp dự kiến</div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className={`text-2xl font-black tabular-nums tracking-tighter ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {positive ? '+' : ''}{formatVnd(profit)}
            </span>
            <span className="text-[10px] font-black text-[var(--text-tertiary)] uppercase">VND</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[var(--secondary)] border border-[var(--border)] p-3 group-hover:border-emerald-500/30 transition-all duration-300 shadow-sm">
            <div className="text-[8.5px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">BIÊN LỢI NHUẬN</div>
            <div className={`text-[14px] font-black tabular-nums ${profitPct >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-xl bg-[var(--secondary)] border border-[var(--border)] p-3 group-hover:border-blue-500/30 transition-all duration-300 shadow-sm">
            <div className="text-[8.5px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-1">Tiến độ thi công</div>
            <div className="text-[14px] font-black text-blue-500 tabular-nums">{margin.toFixed(1)}%</div>
          </div>
        </div>
        <button className="w-full text-[10px] font-black bg-blue-600 text-white py-3 rounded-xl hover:bg-blue-500 uppercase tracking-[0.15em] transition-all duration-300 shadow-lg shadow-blue-600/20 active:scale-[0.98]">
          Báo cáo phân tích hiệu quả
        </button>
      </div>
    </section>
  );
}
