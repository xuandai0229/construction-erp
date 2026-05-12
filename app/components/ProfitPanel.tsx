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
    <section className="card-elevation p-5 animate-fade-in">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="text-[14px] font-bold tracking-tight text-slate-100">LÃI LỖ DỰ ÁN</h3>
        <span className={`rounded px-2 py-0.5 text-[10px] font-bold ring-1 ${profit >= 0 ? 'bg-green-500/10 text-green-400 ring-green-500/20' : 'bg-red-500/10 text-red-400 ring-red-500/20'}`}>
          {profit >= 0 ? 'CÓ LÃI' : 'LỖ VỐN'}
        </span>
      </div>
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_140px] gap-6">
        <div className="space-y-3.5 tabular-nums">
          <Metric label="Tổng doanh thu" value={data.revenue} />
          <Metric label="Tổng chi phí" value={cost} />
          <div className="h-px bg-slate-800/50 my-1" />
          <Metric label="Lợi nhuận" value={profit} accent={profit >= 0 ? 'text-green-400' : 'text-red-400'} />
          <Metric label="% lợi nhuận" raw={`${profitRate.toFixed(1)}%`} accent={profitRate >= 0 ? 'text-green-400' : 'text-red-400'} />
        </div>
        <div className="flex flex-col items-center justify-center">
          <div className="relative h-[100px] w-[100px]">
            <svg viewBox="0 0 42 42" className="-rotate-90 h-full w-full">
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#3b82f6" strokeWidth="6" strokeDasharray={`${costSlice} ${100 - costSlice}`} />
              <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#22c55e" strokeWidth="6" strokeDasharray={`${profitSlice} ${100 - profitSlice}`} strokeDashoffset={-costSlice} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-400 font-medium">Margin</span>
              <span className={`text-sm font-bold ${profitRate >= 0 ? 'text-green-400' : 'text-red-400'}`}>{profitRate.toFixed(0)}%</span>
            </div>
          </div>
          <div className="mt-4 w-full space-y-2 text-[11px]">
            <Legend color="bg-green-500" label="Lãi" />
            <Legend color="bg-blue-500" label="Phí" />
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

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2 text-slate-400">
      <i className={`h-1.5 w-1.5 rounded-full ${color}`} />
      <span className="font-medium tracking-tight uppercase text-[9px]">{label}</span>
    </div>
  );
}

