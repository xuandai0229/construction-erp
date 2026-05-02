'use client';

import { DashboardData, formatDate, formatShortVnd, formatVnd } from './dashboard-data';

export default function ChartSection({ data }: { data: DashboardData }) {
  return (
    <section className="grid grid-cols-[1.15fr_1.15fr_.9fr] gap-4">
      <BudgetPie data={data} />
      <CashFlow data={data} />
      <ProgressCard data={data} />
    </section>
  );
}

function BudgetPie({ data }: { data: DashboardData }) {
  const total = data.costByType.reduce((sum, row) => sum + row.value, 0);
  const segments = data.costByType.map((row, index, rows) => {
    const pct = total > 0 ? (row.value / total) * 100 : 0;
    const previous = rows.slice(0, index).reduce((sum, item) => sum + (total > 0 ? (item.value / total) * 100 : 0), 0);
    return { ...row, pct, offset: 25 - previous };
  });

  return (
    <Panel title="PHÂN BỔ NGÂN SÁCH">
      <div className="grid grid-cols-[210px_1fr] items-center gap-6">
        <div className="relative h-[210px] w-[210px]">
          <svg viewBox="0 0 42 42" className="-rotate-90">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="#0f172a" strokeWidth="7" />
            {segments.map((row) => (
              <circle key={row.type} cx="21" cy="21" r="15.915" fill="transparent" stroke={row.color} strokeWidth="7" strokeDasharray={`${row.pct} ${100 - row.pct}`} strokeDashoffset={row.offset} />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center text-center">
            <div>
              <div className="text-2xl font-extrabold text-white">{formatShortVnd(total)}</div>
              <div className="text-xs font-bold text-slate-300">VND</div>
            </div>
          </div>
        </div>
        <div className="space-y-4">
          {segments.map((row) => {
            return (
              <div key={row.type} className="grid grid-cols-[1fr_48px_108px] items-center gap-3 text-sm">
                <div className="flex items-center gap-3 text-slate-100">
                  <span className="h-3 w-3 rounded-full" style={{ backgroundColor: row.color }} />
                  {row.label}
                </div>
                <div className="text-right font-bold text-slate-100">{row.pct.toFixed(0)}%</div>
                <div className="text-right font-bold text-slate-100">{formatVnd(row.value)}</div>
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
  const x = (index: number) => 28 + (index * (width - 52)) / (data.cashFlow.length - 1);
  const y = (value: number) => height - 24 - (value / max) * (height - 42);
  const line = (key: 'income' | 'expense') => data.cashFlow.map((point, index) => `${x(index)},${y(point[key])}`).join(' ');

  return (
    <Panel title="DÒNG TIỀN (TRIỆU VND)">
      <div className="mb-2 flex items-center justify-center gap-8 text-sm font-semibold">
        <span className="flex items-center gap-2 text-green-400"><i className="h-1.5 w-5 rounded-full bg-green-500" />Thu</span>
        <span className="flex items-center gap-2 text-red-400"><i className="h-1.5 w-5 rounded-full bg-red-500" />Chi</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-[222px] w-full">
        {[0, 1, 2, 3, 4].map((tick) => {
          const yy = 18 + tick * 38;
          return <line key={tick} x1="28" x2={width - 10} y1={yy} y2={yy} stroke="#1e293b" strokeWidth="1" />;
        })}
        <polyline points={line('income')} fill="none" stroke="#22c55e" strokeWidth="3" />
        <polyline points={line('expense')} fill="none" stroke="#ef4444" strokeWidth="3" />
        {data.cashFlow.map((point, index) => (
          <g key={point.month}>
            <circle cx={x(index)} cy={y(point.income)} r="4" fill="#22c55e" />
            <circle cx={x(index)} cy={y(point.expense)} r="4" fill="#ef4444" />
            {index % 2 === 0 && <text x={x(index)} y={height - 4} fill="#94a3b8" fontSize="11" textAnchor="middle">{point.month}</text>}
          </g>
        ))}
        {[0, 10, 20, 30, 40].map((label, index) => (
          <text key={label} x="0" y={height - 24 - index * 38} fill="#94a3b8" fontSize="11">{label}B</text>
        ))}
      </svg>
    </Panel>
  );
}

function ProgressCard({ data }: { data: DashboardData }) {
  const circumference = 2 * Math.PI * 66;
  return (
    <Panel title="TIẾN ĐỘ TỔNG THỂ">
      <div className="grid place-items-center py-2">
        <div className="relative h-[190px] w-[190px]">
          <svg viewBox="0 0 160 160" className="-rotate-90">
            <circle cx="80" cy="80" r="66" fill="none" stroke="#334155" strokeWidth="18" strokeDasharray={`${circumference * 0.5} ${circumference}`} strokeLinecap="butt" />
            <circle cx="80" cy="80" r="66" fill="none" stroke="#22c55e" strokeWidth="18" strokeDasharray={`${circumference * (data.progress / 100) * 0.5} ${circumference}`} strokeLinecap="butt" />
          </svg>
          <div className="absolute inset-0 grid place-items-center text-4xl font-extrabold text-white">{data.progress}%</div>
        </div>
      </div>
      <div className="space-y-3 text-sm">
        <Row label="Ngày bắt đầu" value={formatDate(data.project.start_date)} />
        <Row label="Ngày kết thúc dự kiến" value={formatDate(data.project.end_date)} />
        <Row label="Số ngày đã qua" value={`${data.daysElapsed} / ${data.durationDays} ngày`} />
      </div>
    </Panel>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <article className="rounded-lg border border-slate-800 bg-slate-900/70 p-5">
      <h3 className="mb-4 text-[15px] font-extrabold text-slate-50">{title}</h3>
      {children}
    </article>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-slate-300">{label}</span>
      <span className="font-bold text-white">{value}</span>
    </div>
  );
}
