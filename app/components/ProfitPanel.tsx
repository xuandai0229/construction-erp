'use client';

import { DashboardData, formatShortVnd, formatVnd } from './dashboard-data';

export default function ProfitPanel({ data }: { data: DashboardData }) {
  const cost    = data.costs.reduce((s, r) => s + r.amount, 0);
  const profit  = data.revenue - cost;
  const margin  = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
  const isProfit = profit >= 0;

  const CIRC  = 2 * Math.PI * 28;
  const cPct  = data.revenue > 0 ? (cost / data.revenue) * 100 : 0;
  const pPct  = data.revenue > 0 ? (Math.max(0, profit) / data.revenue) * 100 : 0;

  return (
    <div className="erp-card flex flex-col h-full">
      <div className="erp-panel-header">
        <h3 className="t-section-title uppercase text-[12px] text-[var(--text-secondary)] tracking-wider">Lãi lỗ dự án</h3>
      </div>
      <div className="erp-card-pad space-y-4">
        {/* Metric Summary */}
        <div className="space-y-2 text-[13px]">
          <Metric label="Doanh thu"  value={data.revenue} />
          <Metric label="Tổng chi phí" value={cost} />
          <div className="pt-2 border-t border-[var(--border)]">
            <Metric 
              label={isProfit ? 'Lợi nhuận' : 'Lỗ'} 
              value={Math.abs(profit)} 
              color={isProfit ? 'text-[var(--success)]' : 'text-[var(--danger)]'}
              bold 
            />
          </div>
          <div className="flex justify-between items-center text-[12px] text-[var(--text-secondary)] pt-1">
             <span>Tỷ lệ lợi nhuận</span>
             <span className={`font-bold ${isProfit ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
                {margin.toFixed(1)}%
             </span>
          </div>
        </div>

        {/* Mini donut / Progress Bar representation */}
        <div className="flex items-center gap-4 pt-2">
          <div className="relative h-16 w-16 flex-shrink-0">
            <svg viewBox="0 0 64 64" className="h-full w-full -rotate-90">
              <circle cx="32" cy="32" r="28" fill="none" stroke="var(--bg-muted)" strokeWidth="8" />
              <circle cx="32" cy="32" r="28" fill="none" stroke="#3B82F6" strokeWidth="8"
                strokeDasharray={`${CIRC * Math.min(100, cPct) / 100} ${CIRC}`} />
            </svg>
            <div className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold ${isProfit ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              {margin.toFixed(0)}%
            </div>
          </div>
          <div className="flex-1 space-y-2">
             <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-[#3B82F6]" />
                <span className="text-[11px] text-[var(--text-secondary)]">Chi phí: {formatShortVnd(cost)}</span>
             </div>
             <div className="flex items-center gap-2">
                <div className={`h-2 w-2 rounded-full ${isProfit ? 'bg-[var(--success)]' : 'bg-[var(--danger)]'}`} />
                <span className="text-[11px] text-[var(--text-secondary)]">
                   {isProfit ? 'Lợi nhuận' : 'Lỗ'}: {formatShortVnd(Math.abs(profit))}
                </span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Metric({
  label, value, color, bold,
}: {
  label: string; value: number; color?: string; bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[var(--text-secondary)]">{label}</span>
      <span className={`tabular-nums ${bold ? 'font-bold' : 'font-medium'} ${color ?? 'text-[var(--text-primary)]'}`}>
        {formatVnd(value)}
      </span>
    </div>
  );
}
