'use client';

import { DashboardData, formatVnd } from './dashboard-data';

export default function ProfitPanel({ data }: { data: DashboardData }) {
  const cost = data.costs.reduce((sum, row) => sum + row.amount, 0);
  const profit = data.revenue - cost;
  const profitRate = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
  const total = Math.max(1, data.revenue + cost);
  const profitSlice = Math.max(0, profit) / total * 100;
  const costSlice = cost / total * 100;

  return (
    <section className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="mb-5 text-[15px] font-extrabold text-slate-50">LÃI LỖ DỰ ÁN</h3>
      <div className="grid grid-cols-[1fr_180px] gap-4">
        <div className="space-y-4 text-sm">
          <Metric label="Tổng doanh thu" value={data.revenue} />
          <Metric label="Tổng chi phí" value={cost} />
          <Metric label="Lợi nhuận" value={profit} accent={profit >= 0 ? 'text-green-400' : 'text-red-400'} />
          <Metric label="% lợi nhuận" raw={`${profitRate.toFixed(1)}%`} accent={profitRate >= 0 ? 'text-green-400' : 'text-red-400'} />
        </div>
        <div className="grid place-items-center">
          <div className="relative h-[140px] w-[140px]">
            <svg viewBox="0 0 42 42" className="-rotate-90">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#2563eb" strokeWidth="8" strokeDasharray={`${costSlice} ${100 - costSlice}`} />
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="8" strokeDasharray={`${profitSlice} ${100 - profitSlice}`} strokeDashoffset={-costSlice} />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-lg font-extrabold text-green-400">{profitRate.toFixed(1)}%</div>
          </div>
          <div className="mt-2 w-full space-y-3 text-xs">
            <Legend color="bg-green-500" label="Lợi nhuận" value={`${formatVnd(Math.max(0, profit))} (${profitRate.toFixed(1)}%)`} />
            <Legend color="bg-blue-500" label="Chi phí" value={`${formatVnd(cost)} (${((cost / total) * 100).toFixed(1)}%)`} />
          </div>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, raw, accent = 'text-slate-100' }: { label: string; value?: number; raw?: string; accent?: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-300">{label}</span>
      <span className={`font-extrabold ${accent}`}>{raw ?? formatVnd(value ?? 0)}</span>
    </div>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 text-slate-300">
      <span className="flex items-center gap-2"><i className={`h-3 w-3 rounded-full ${color}`} />{label}</span>
      <span className="font-semibold text-slate-100">{value}</span>
    </div>
  );
}

