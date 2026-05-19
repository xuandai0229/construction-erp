'use client';

import { DashboardData, formatDate, formatShortVnd } from './dashboard-data';

export default function ChartSection({ data }: { data: DashboardData }) {
  return (
    <section className="grid grid-cols-[1.15fr_1.15fr_.9fr] gap-4">
      <BudgetPie data={data} />
      <CashFlow data={data} />
      <ProgressCard data={data} />
    </section>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--erp-card-shadow)] hover:shadow-[var(--erp-hover-shadow)] transition-executive hover-lift-xs">
      <h3 className="mb-6 text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.2em] flex items-center gap-2">
        <span className="h-1.5 w-1.5 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)] pulse-subtle" />
        {title}
      </h3>
      {children}
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[var(--divider)] last:border-0 group">
      <span className="text-[12px] font-bold text-[var(--text-secondary)] transition-executive group-hover:text-[var(--text-primary)]">{label}</span>
      <span className="text-[12.5px] font-black text-[var(--text-primary)] tabular-nums transition-executive group-hover:text-blue-500">{value}</span>
    </div>
  );
}

function BudgetPie({ data }: { data: DashboardData }) {
  // Authoritative total from backend
  const total = data.totalCost;
  const segments = data.costByType.map((row, index, rows) => {
    const pct = total > 0 ? (row.value / total) * 100 : 0;
    const previous = rows.slice(0, index).reduce((sum, item) => sum + (total > 0 ? (item.value / total) * 100 : 0), 0);
    return { ...row, pct, offset: 25 - previous };
  });

  return (
    <Panel title="PHÂN BỔ NGÂN SÁCH">
      <div className="grid grid-cols-[180px_1fr] items-center gap-8">
        <div className="relative h-[180px] w-[180px]">
          <svg viewBox="0 0 42 42" className="-rotate-90 drop-shadow-lg">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--secondary)" strokeWidth="6.5" />
            {segments.map((row) => (
              <circle 
                key={row.type} 
                cx="21" 
                cy="21" 
                r="15.915" 
                fill="transparent" 
                stroke={row.color} 
                strokeWidth="7" 
                strokeDasharray={`${row.pct} ${100 - row.pct}`} 
                strokeDashoffset={row.offset} 
                className="progress-fill"
                style={{ transition: 'stroke-dasharray var(--motion-duration-slow) var(--motion-easing-executive), stroke-dashoffset var(--motion-duration-slow) var(--motion-easing-executive)' }}
              />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-xl font-black text-[var(--text-primary)] tracking-tight leading-none mb-1">{formatShortVnd(total)}</div>
              <div className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">TỔNG CỘNG</div>
            </div>
          </div>
        </div>
        <div className="space-y-3.5">
          {segments.map((row) => {
            return (
              <div key={row.type} className="flex items-center justify-between text-[12px] group">
                <div className="flex items-center gap-3 text-[var(--text-secondary)] font-bold group-hover:text-[var(--text-primary)] transition-colors">
                  <span className="h-2 w-2 rounded-full shadow-sm" style={{ backgroundColor: row.color }} />
                  {row.label}
                </div>
                <div className="flex gap-4 items-center">
                   <div className="text-right font-black text-[var(--text-primary)] tabular-nums">{row.pct.toFixed(0)}%</div>
                   <div className="text-right font-bold text-[var(--text-tertiary)] tabular-nums w-24">{formatShortVnd(row.value)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </Panel>
  );
}

function CashFlow({ data }: { data: DashboardData }) {
  const width = 500;
  const height = 200;
  const max = Math.max(...data.cashFlow.flatMap((point) => [point.income, point.expense]));
  const x = (index: number) => 32 + (index * (width - 64)) / (data.cashFlow.length - 1);
  const y = (value: number) => height - 32 - (value / max) * (height - 64);
  const line = (key: 'income' | 'expense') => data.cashFlow.map((point, index) => `${x(index)},${y(point[key])}`).join(' ');

  return (
    <Panel title="DÒNG TIỀN (TRIỆU VND)">
      <div className="mb-6 flex items-center justify-center gap-10 text-[10px] font-black uppercase tracking-widest">
        <span className="flex items-center gap-2.5 text-emerald-500">
          <i className="h-1.5 w-6 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
          Dòng thu
        </span>
        <span className="flex items-center gap-2.5 text-rose-500">
          <i className="h-1.5 w-6 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.4)]" />
          Dòng chi
        </span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[200px] w-full overflow-visible">
        {[0, 1, 2, 3, 4].map((tick) => {
          const yy = 24 + tick * 36;
          return <line key={tick} x1="32" x2={width - 32} y1={yy} y2={yy} stroke="var(--divider)" strokeWidth="1" strokeDasharray="4 4" />;
        })}
        <polyline points={line('income')} fill="none" stroke="#10b981" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />
        <polyline points={line('expense')} fill="none" stroke="#f43f5e" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="drop-shadow-md" />
        {data.cashFlow.map((point, index) => (
          <g key={point.month} className="group/dot">
            <circle cx={x(index)} cy={y(point.income)} r="5" fill="#10b981" stroke="var(--card)" strokeWidth="2" className="drop-shadow-sm" />
            <circle cx={x(index)} cy={y(point.expense)} r="5" fill="#f43f5e" stroke="var(--card)" strokeWidth="2" className="drop-shadow-sm" />
            <text x={x(index)} y={height - 4} fill="var(--text-tertiary)" fontSize="10" fontWeight="900" textAnchor="middle" className="uppercase tracking-tighter">{point.month}</text>
          </g>
        ))}
      </svg>
    </Panel>
  );
}

function ProgressCard({ data }: { data: DashboardData }) {
  const circumference = 2 * Math.PI * 66;
  return (
    <Panel title="TIẾN ĐỘ TỔNG THỂ">
      <div className="grid place-items-center py-4">
        <div className="relative h-[160px] w-[160px]">
          <svg viewBox="0 0 160 160" className="-rotate-90 drop-shadow-xl">
            <circle cx="80" cy="80" r="66" fill="none" stroke="var(--secondary)" strokeWidth="16" strokeDasharray={`${circumference * 0.5} ${circumference}`} strokeLinecap="round" />
            <circle cx="80" cy="80" r="66" fill="none" stroke="#10b981" strokeWidth="16" strokeDasharray={`${circumference * (data.progress / 100) * 0.5} ${circumference}`} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 grid place-items-center">
            <div className="text-center">
              <div className="text-3xl font-black text-[var(--text-primary)] leading-none mb-1">{data.progress}%</div>
              <div className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest">HOÀN THÀNH</div>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-4 space-y-1">
        <Row label="Bắt đầu" value={formatDate(data.project.startDate)} />
        <Row label="Kết thúc" value={formatDate(data.project.endDate)} />
        <Row label="Tiến độ thời gian" value={`${data.daysElapsed} / ${data.durationDays} ngày`} />
      </div>
    </Panel>
  );
}

