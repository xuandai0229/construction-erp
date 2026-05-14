'use client';

import { DebtSummary, formatVnd } from './dashboard-data';

export function DebtPanel({ receivable, payable }: { receivable: DebtSummary, payable: DebtSummary }) {
  const receivablePct = receivable.total > 0 ? (receivable.paid / receivable.total) * 100 : 0;
  const payablePct    = payable.total    > 0 ? (payable.paid    / payable.total)    * 100 : 0;

  return (
    <section className="space-y-4">
      {/* Receivable */}
      <div className="card-elevation p-4 group cursor-default">
        <div className="accent-line mb-3">
          <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest group-hover:text-blue-600 transition-colors">Công nợ Phải thu khách hàng</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tổng hóa đơn thu</span>
            <span className="text-[12px] font-black text-[var(--text-primary)] tabular-nums">{formatVnd(receivable.total)}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width: `${Math.min(100, receivablePct)}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] font-black text-gray-400 uppercase">Đã đối soát</div>
              <div className="text-[11px] font-black text-blue-600 tabular-nums">{formatVnd(receivable.paid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-black text-gray-400 uppercase">Dư nợ còn lại</div>
              <div className="text-[11px] font-black text-slate-600 tabular-nums">{formatVnd(receivable.remaining)}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Payable */}
      <div className="card-elevation p-4 group cursor-default">
        <div className="accent-line mb-3" style={{ '--accent-color': '#f59e0b' } as React.CSSProperties}>
          <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest group-hover:text-amber-600 transition-colors">Công nợ Phải trả NCC/TP</h3>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Tổng nợ phải trả</span>
            <span className="text-[12px] font-black text-[var(--text-primary)] tabular-nums">{formatVnd(payable.total)}</span>
          </div>
          <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-amber-500 transition-all duration-700" style={{ width: `${Math.min(100, payablePct)}%` }} />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[8px] font-black text-gray-400 uppercase">Đã thanh toán</div>
              <div className="text-[11px] font-black text-amber-600 tabular-nums">{formatVnd(payable.paid)}</div>
            </div>
            <div className="text-right">
              <div className="text-[8px] font-black text-rose-400 uppercase">Quá hạn thanh toán</div>
              <div className="text-[11px] font-black text-rose-600 tabular-nums">{formatVnd(payable.overdue)}</div>
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
    <section className="card-elevation p-4 group cursor-default">
      <div className="accent-line mb-3">
        <h3 className="text-[10px] font-black text-[var(--text-primary)] uppercase tracking-widest group-hover:text-emerald-600 transition-colors">Hiệu quả tài chính dự án</h3>
      </div>

      <div className="space-y-4">
        <div>
          <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Lợi nhuận dự kiến</div>
          <div className="flex items-baseline gap-1.5 flex-wrap">
            <span className={`text-xl font-black tabular-nums tracking-tight ${positive ? 'text-emerald-600' : 'text-rose-600'}`}>
              {positive ? '+' : ''}{formatVnd(profit)}
            </span>
            <span className="text-[9px] font-black text-gray-400 uppercase">VNĐ</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 group-hover:border-emerald-100 transition-colors">
            <div className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Tỷ suất gộp</div>
            <div className={`text-[13px] font-black tabular-nums ${profitPct >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {profitPct >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
            </div>
          </div>
          <div className="rounded-lg bg-slate-50 border border-slate-100 p-2 group-hover:border-blue-100 transition-colors">
            <div className="text-[8px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Tiến độ thi công</div>
            <div className="text-[13px] font-black text-blue-600 tabular-nums">{margin.toFixed(1)}%</div>
          </div>
        </div>
        <button className="w-full text-[9px] font-black bg-blue-600 text-white py-2.5 rounded-lg hover:bg-blue-700 uppercase tracking-widest transition-all shadow-sm">
          Báo cáo Phân tích tài chính dự án
        </button>
      </div>
    </section>
  );
}
