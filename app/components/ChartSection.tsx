'use client';

import { DashboardData, formatShortVnd } from './dashboard-data';

export default function ChartSection({ data }: { data: DashboardData }) {
  // Mock monthly data based on project duration
  const months = ['01/2024', '03/2024', '05/2024', '07/2024', '09/2024', '11/2024', '01/2025'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-[var(--sp-24)]">
      {/* Budget Allocation (Pie) */}
      <div className="erp-card flex flex-col">
        <div className="erp-panel-header">
          <h3 className="t-section-title">Phân bổ ngân sách</h3>
        </div>
        <div className="erp-card-pad flex-1 flex flex-col items-center justify-center">
          <div className="h-44 w-44 rounded-full border-[12px] border-[var(--bg-subtle)] flex items-center justify-center relative">
             {/* Simple SVG Donut Representation */}
             <svg className="absolute inset-0 h-full w-full -rotate-90">
               <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="#2563EB" strokeWidth="12" strokeDasharray="40 100" />
               <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="#22C55E" strokeWidth="12" strokeDasharray="20 100" strokeDashoffset="-40" />
               <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="#F59E0B" strokeWidth="12" strokeDasharray="15 100" strokeDashoffset="-60" />
               <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="#6366F1" strokeWidth="12" strokeDasharray="15 100" strokeDashoffset="-75" />
               <circle cx="50%" cy="50%" r="42%" fill="transparent" stroke="#3B82F6" strokeWidth="12" strokeDasharray="10 100" strokeDashoffset="-90" />
             </svg>
             <div className="text-center">
                <div className="text-[22px] font-bold text-[var(--text-primary)]">45,000</div>
                <div className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider">Tỷ VND</div>
             </div>
          </div>

          <div className="mt-8 w-full space-y-2">
            <LegendItem color="#2563EB" label="Vật liệu" pct="40%" val="18,000,000,000" />
            <LegendItem color="#22C55E" label="Nhân công" pct="20%" val="9,000,000,000" />
            <LegendItem color="#F59E0B" label="Máy móc" pct="15%" val="6,750,000,000" />
            <LegendItem color="#6366F1" label="Thầu phụ" pct="15%" val="6,750,000,000" />
            <LegendItem color="#3B82F6" label="Chi phí chung" pct="10%" val="4,500,000,000" />
          </div>
        </div>
      </div>

      {/* Cashflow (Line) */}
      <div className="erp-card lg:col-span-2 flex flex-col">
        <div className="erp-panel-header">
          <h3 className="t-section-title">Dòng tiền (Tỷ VND)</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full bg-[#22C55E]"></span> Thu
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--text-secondary)]">
              <span className="h-2 w-2 rounded-full bg-[#EF4444]"></span> Chi
            </div>
          </div>
        </div>
        <div className="erp-card-pad flex-1 flex flex-col">
           <div className="flex-1 relative border-l border-b border-[var(--border)] mt-4 ml-10 mb-8">
              {/* Grid Lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none">
                 {[1,2,3,4,5].map(i => <div key={i} className="w-full border-t border-[var(--bg-subtle)]" />)}
              </div>
              {/* Chart Lines */}
              <svg className="absolute inset-0 h-full w-full overflow-visible">
                 {/* Revenue Line */}
                 <path d="M0,100 L50,80 L100,60 L150,45 L200,30 L250,15 L300,5" fill="none" stroke="#22C55E" strokeWidth="3" className="w-full h-full" />
                 {/* Cost Line */}
                 <path d="M0,100 L50,85 L100,75 L150,70 L200,65 L250,55 L300,50" fill="none" stroke="#EF4444" strokeWidth="3" className="w-full h-full" />
              </svg>
              {/* Y Axis Labels */}
              <div className="absolute -left-10 inset-y-0 flex flex-col justify-between text-[10px] font-bold text-[var(--text-muted)] py-0">
                 <span>50B</span><span>40B</span><span>30B</span><span>20B</span><span>10B</span><span>0</span>
              </div>
              {/* X Axis Labels */}
              <div className="absolute -bottom-8 inset-x-0 flex justify-between text-[10px] font-bold text-[var(--text-muted)] px-0">
                 {months.map(m => <span key={m}>{m}</span>)}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function LegendItem({ color, label, pct, val }: { color: string; label: string; pct: string; val: string }) {
  return (
    <div className="flex items-center justify-between text-[12px]">
      <div className="flex items-center gap-2">
        <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="font-medium text-[var(--text-secondary)]">{label}</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-[var(--text-muted)] font-medium">{pct}</span>
        <span className="font-bold text-[var(--text-primary)] tabular-nums">{formatShortVnd(parseInt(val))}</span>
      </div>
    </div>
  );
}
