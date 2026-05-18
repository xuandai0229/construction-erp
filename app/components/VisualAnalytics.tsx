'use client';

import React from 'react';

/* ═══════════════════════════════════════════════════════════════
   Visual Analytics — Enterprise Polish Pass
   
   Typography hierarchy:
   • Section title: 10px / semibold / uppercase / tracking-[0.15em]
   • Sub-header:   9px / medium / uppercase / tracking-widest
   • Data label:   10.5px / medium / text-secondary
   • Data value:   10.5px / semibold / tabular-nums / text-primary
   • Chart center: 13px / bold / tracking-tight
   
   Chart refinements:
   • Thinner strokes, smaller dots
   • Grid nearly invisible (opacity ~0.3)
   • Smooth visual weight, premium feel
   ═══════════════════════════════════════════════════════════════ */

const fmtNum = (v: number) => v.toLocaleString('vi-VN');

const fmtShort = (v: number) => {
  if (v >= 1e9) return `${(v / 1e9).toFixed(1)} tỷ`;
  if (v >= 1e6) return `${(v / 1e6).toFixed(0)} triệu`;
  return fmtNum(v);
};

// ─── 1. BUDGET ALLOCATION (Donut + Legend) ──────────────────
export function BudgetAllocationChart({ data }: { data: any }) {
  const costByType = data?.costByType || [];
  const total = costByType.reduce((s: number, c: any) => s + c.value, 0);

  if (costByType.length === 0 || total === 0) {
    return (
      <div className="h-full flex flex-col justify-between">
        <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-4">Phân bổ ngân sách</h4>
        <div className="flex-1 flex flex-col items-center justify-center py-6 border border-dashed border-[var(--border)] rounded-lg bg-[var(--card)]/30 min-h-[110px]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--text-tertiary)]/50 mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold tracking-wide">No categorized budget data</span>
        </div>
      </div>
    );
  }

  let acc = 0;
  const segs = costByType.map((c: any) => {
    const pct = total > 0 ? (c.value / total) * 100 : 0;
    const offset = 25 - acc;
    acc += pct;
    return { ...c, pct, offset };
  });

  return (
    <div>
      <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-4">Phân bổ ngân sách</h4>
      <div className="flex items-center gap-5">
        <div className="relative w-[110px] h-[110px] shrink-0">
          <svg viewBox="0 0 42 42" className="-rotate-90 w-full h-full">
            <circle cx="21" cy="21" r="15.915" fill="transparent" stroke="var(--divider)" strokeWidth="5" />
            {segs.map((s: any) => (
              <circle key={s.type} cx="21" cy="21" r="15.915" fill="transparent"
                stroke={s.color} strokeWidth="5"
                strokeDasharray={`${s.pct} ${100 - s.pct}`} strokeDashoffset={s.offset}
                className="transition-all duration-700 ease-out hover:stroke-[6.5] cursor-pointer" />
            ))}
          </svg>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-center">
              <div className="text-[13px] font-bold text-[var(--text-primary)] leading-none tracking-tight">{fmtShort(total)}</div>
              <div className="text-[7px] font-medium text-[var(--text-tertiary)] uppercase tracking-widest mt-0.5">Triệu VND</div>
            </div>
          </div>
        </div>
        <div className="flex-1 space-y-1 min-w-0">
          {segs.map((s: any) => (
            <div key={s.type} className="flex items-center gap-2 text-[10.5px] group cursor-default">
              <span className="h-1.5 w-1.5 rounded-full shrink-0 group-hover:scale-125 transition-transform" style={{ backgroundColor: s.color }} />
              <span className="text-[var(--text-secondary)] font-medium truncate group-hover:text-[var(--text-primary)] transition-colors">{s.label}</span>
              <span className="ml-auto font-semibold text-[var(--text-primary)] tabular-nums shrink-0">{s.pct.toFixed(0)}%</span>
              <span className="font-medium text-[var(--text-tertiary)] tabular-nums text-right w-[80px] shrink-0">{fmtNum(s.value)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── 2. CASHFLOW TREND (Line Chart — smooth, premium) ───────
export function CashflowTrendChart({ data }: { data: any }) {
  const trend = data?.trend || [];
  const forecast = data?.forecast || [];
  const combined = [...trend, ...forecast];
  if (combined.length === 0) return null;

  const W = 460, H = 150, PL = 28, PR = 8, PT = 12, PB = 18;
  const pW = W - PL - PR, pH = H - PT - PB;
  const mx = Math.max(1, ...combined.flatMap(p => [p.income, p.expense])) * 1.05;
  const px = (i: number) => PL + (i * pW) / Math.max(1, combined.length - 1);
  const py = (v: number) => PT + pH - (v / mx) * pH;

  const incPts = combined.map((p, i) => `${px(i)},${py(p.income)}`).join(' ');
  const expPts = combined.map((p, i) => `${px(i)},${py(p.expense)}`).join(' ');
  const incArea = `${px(0)},${PT + pH} ${incPts} ${px(combined.length - 1)},${PT + pH}`;

  const ticks = [0, 1, 2, 3].map(i => ({ y: py((mx / 3) * i), label: `${((mx / 3) * i).toFixed(0)}` }));

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">Dòng tiền (triệu VND)</h4>
        <div className="flex items-center gap-3 text-[8px] font-medium">
          <span className="flex items-center gap-1 text-emerald-500"><i className="h-[2px] w-2.5 rounded-full bg-emerald-500" /> Thu</span>
          <span className="flex items-center gap-1 text-rose-400"><i className="h-[2px] w-2.5 rounded-full bg-rose-400" /> Chi</span>
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-[130px]" preserveAspectRatio="xMidYMid meet">
        <defs>
          <linearGradient id="cfG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.07" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={t.y} y2={t.y} stroke="var(--divider)" strokeWidth="0.4" />
            <text x={PL - 3} y={t.y + 3} fill="var(--text-tertiary)" fontSize="6" fontWeight="500" textAnchor="end" opacity="0.6">{t.label}</text>
          </g>
        ))}
        <polygon points={incArea} fill="url(#cfG)" />
        <polyline points={incPts} fill="none" stroke="#10b981" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points={expPts} fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        {trend.length > 0 && trend.length < combined.length && (
          <line x1={px(trend.length - 1)} x2={px(trend.length - 1)} y1={PT} y2={PT + pH} stroke="var(--text-tertiary)" strokeWidth="0.5" strokeDasharray="3 3" opacity="0.25" />
        )}
        {combined.map((p, i) => (
          <g key={i}>
            <circle cx={px(i)} cy={py(p.income)} r="2" fill="#10b981" className="transition-all duration-200" />
            <circle cx={px(i)} cy={py(p.expense)} r="2" fill="#f43f5e" className="transition-all duration-200" />
            {i % Math.max(1, Math.ceil(combined.length / 7)) === 0 && (
              <text x={px(i)} y={H - 2} fill="var(--text-tertiary)" fontSize="6.5" fontWeight="500" textAnchor="middle" opacity="0.7">{p.month}</text>
            )}
          </g>
        ))}
      </svg>
    </div>
  );
}

// ─── 3. PROJECT PROGRESS + EVM (Gauge + Details) ────────────
export function ProjectProgressChart({ data, timeline }: { data: any; timeline: any }) {
  const spi = data?.spi;
  const cpi = data?.cpi;

  if (spi === null || spi === undefined || cpi === null || cpi === undefined) {
    return (
      <div className="h-full flex flex-col justify-between">
        <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-3">Tiến độ tổng thể</h4>
        <div className="flex-1 flex flex-col items-center justify-center py-6 border border-dashed border-[var(--border)] rounded-lg bg-[var(--card)]/30 min-h-[110px]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--text-tertiary)]/50 mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
          </svg>
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold tracking-wide">No approved baseline schedule</span>
        </div>
      </div>
    );
  }

  const progress = data?.actualProgress ?? data?.taskProgress ?? 0;
  const planned = data?.plannedProgress ?? data?.timeProgress ?? 0;
  const daysElapsed = data?.daysElapsed ?? 0;
  const durationDays = data?.durationDays ?? 365;

  const R = 50, C = 2 * Math.PI * R;
  const arc = (progress / 100) * C * 0.75;
  const progressColor = progress >= planned ? '#10b981' : (progress >= planned * 0.8 ? '#f59e0b' : '#ef4444');

  const spiColor = spi >= 1.0 ? 'text-emerald-500' : (spi >= 0.85 ? 'text-amber-500' : 'text-rose-500');
  const cpiColor = cpi >= 1.0 ? 'text-emerald-500' : (cpi >= 0.85 ? 'text-amber-500' : 'text-rose-500');

  return (
    <div>
      <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-3">Tiến độ tổng thể</h4>
      <div className="flex items-center gap-5">
        <div className="relative w-[100px] h-[100px] shrink-0">
          <svg viewBox="0 0 120 120" className="w-full h-full">
            <circle cx="60" cy="60" r={R} fill="none" stroke="var(--divider)" strokeWidth="6"
              strokeDasharray={`${C * 0.75} ${C * 0.25}`} strokeLinecap="round" transform="rotate(135 60 60)" />
            <circle cx="60" cy="60" r={R} fill="none" stroke={progressColor} strokeWidth="6"
              strokeDasharray={`${arc} ${C}`} strokeLinecap="round" transform="rotate(135 60 60)"
              className="transition-all duration-1000 ease-out" />
          </svg>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-[18px] font-bold leading-none tracking-tight mt-[-3px]" style={{ color: progressColor }}>{progress.toFixed(0)}%</div>
          </div>
        </div>
        <div className="space-y-1.5 text-[10.5px] flex-1 min-w-0">
          <div className="flex justify-between"><span className="text-[var(--text-tertiary)] font-medium">Kế hoạch</span><span className="text-[var(--text-primary)] font-semibold tabular-nums">{planned.toFixed(1)}%</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-tertiary)] font-medium">Số ngày đã qua</span><span className="text-[var(--text-primary)] font-semibold tabular-nums">{daysElapsed} / {durationDays} ngày</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-tertiary)] font-medium">SPI</span><span className={`font-semibold tabular-nums ${spiColor}`}>{spi.toFixed(2)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-tertiary)] font-medium">CPI</span><span className={`font-semibold tabular-nums ${cpiColor}`}>{cpi.toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}

// ─── 4. DEBT SUMMARY (Công nợ) ──────────────────────────────
export function DebtPaymentChart({ kpis }: { kpis: any }) {
  const recTotal = kpis?.totalInvoiced ?? 0;
  const recPaid = kpis?.totalPaidInvoice ?? 0;
  const recRemaining = kpis?.totalRemainingInvoice ?? 0;
  const recOverdue = kpis?.overdueInvoices ?? 0;
  const payTotal = kpis?.totalCost ?? 0;
  const payPaid = kpis?.paidCost ?? 0;
  const payRemaining = kpis?.unpaidCost ?? 0;

  const Dot = ({ color }: { color: string }) => <span className={`inline-block h-[6px] w-[6px] rounded-full ${color} shrink-0`} />;

  return (
    <div>
      <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-3">Công nợ</h4>
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="text-[8.5px] font-medium text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Phải thu (Khách hàng)</div>
          <div className="space-y-1.5 text-[10.5px]">
            <div className="flex items-center gap-2"><Dot color="bg-blue-500" /><span className="text-[var(--text-secondary)] font-medium">Tổng phải thu</span><span className="ml-auto text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(recTotal)}</span></div>
            <div className="flex items-center gap-2"><Dot color="bg-emerald-500" /><span className="text-[var(--text-secondary)] font-medium">Đã thu</span><span className="ml-auto text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(recPaid)}</span></div>
            <div className="flex items-center gap-2"><Dot color="bg-amber-500" /><span className="text-[var(--text-secondary)] font-medium">Còn lại</span><span className="ml-auto text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(recRemaining)}</span></div>
            <div className="flex items-center gap-2"><Dot color="bg-rose-500" /><span className="text-rose-500 font-medium">Quá hạn</span><span className="ml-auto text-rose-500 font-semibold tabular-nums">{fmtNum(recOverdue)}</span></div>
          </div>
        </div>
        <div>
          <div className="text-[8.5px] font-medium text-[var(--text-tertiary)] uppercase tracking-widest mb-2">Phải trả (Nhà cung cấp)</div>
          <div className="space-y-1.5 text-[10.5px]">
            <div className="flex items-center gap-2"><Dot color="bg-blue-500" /><span className="text-[var(--text-secondary)] font-medium">Tổng phải trả</span><span className="ml-auto text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(payTotal)}</span></div>
            <div className="flex items-center gap-2"><Dot color="bg-emerald-500" /><span className="text-[var(--text-secondary)] font-medium">Đã trả</span><span className="ml-auto text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(payPaid)}</span></div>
            <div className="flex items-center gap-2"><Dot color="bg-amber-500" /><span className="text-[var(--text-secondary)] font-medium">Còn lại</span><span className="ml-auto text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(payRemaining)}</span></div>
            <div className="flex items-center gap-2"><Dot color="bg-rose-500" /><span className="text-rose-500 font-medium">Quá hạn</span><span className="ml-auto text-rose-500 font-semibold tabular-nums">{fmtNum(0)}</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── 5. PROFITABILITY + VARIANCE (Lãi Lỗ Dự Án) ────────────
export function ProfitabilityChart({ kpis }: { kpis: any }) {
  // Revenue = recognized revenue (from approved invoices, NOT contractValue)
  const revenue = kpis?.totalRevenue ?? 0;
  const contractValue = kpis?.contractValue ?? 0;
  const cost = kpis?.totalCost ?? 0;
  const profit = kpis?.grossProfit ?? (revenue - cost);
  const margin = kpis?.grossMargin ?? (revenue > 0 ? ((revenue - cost) / revenue) * 100 : 0);
  const budgetVariance = kpis?.budgetVariance ?? 0;
  const costOverrunPct = kpis?.costOverrunPct ?? 0;
  // Donut: use contractValue as reference if no revenue recognized yet
  const refDenom = revenue > 0 ? revenue : (contractValue > 0 ? contractValue : cost || 1);
  const costPct = refDenom > 0 ? (cost / refDenom) * 100 : 0;
  const profitPct = Math.max(0, 100 - costPct);

  const varianceColor = budgetVariance >= 0 ? 'text-emerald-500' : 'text-rose-500';

  return (
    <div>
      <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-3">Lãi lỗ dự án</h4>
      <div className="grid grid-cols-[1fr_auto] gap-5 items-center">
        <div className="space-y-1 text-[10.5px]">
          <div className="flex justify-between"><span className="text-[var(--text-secondary)] font-medium">Doanh thu</span><span className="text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(revenue)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)] font-medium">Tổng chi phí</span><span className="text-[var(--text-primary)] font-semibold tabular-nums">{fmtNum(cost)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-primary)] font-semibold">Lợi nhuận</span><span className={`font-bold tabular-nums ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{fmtNum(profit)}</span></div>
          <div className="flex justify-between"><span className="text-[var(--text-secondary)] font-medium">Tỷ lệ lợi nhuận</span><span className={`font-semibold ${margin >= 10 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin.toFixed(1)}%</span></div>
          <div className="flex justify-between mt-1 pt-1 border-t border-[var(--divider)]"><span className="text-[var(--text-tertiary)] font-medium">Chênh lệch ngân sách</span><span className={`font-semibold tabular-nums ${varianceColor}`}>{budgetVariance >= 0 ? '+' : ''}{fmtShort(budgetVariance)}</span></div>
        </div>
        <div className="relative w-[64px] h-[64px]">
          <svg viewBox="0 0 36 36" className="-rotate-90 w-full h-full">
            <circle cx="18" cy="18" r="14" fill="none" stroke="var(--divider)" strokeWidth="2.5" />
            <circle cx="18" cy="18" r="14" fill="none" stroke={costOverrunPct > 100 ? '#ef4444' : '#10b981'} strokeWidth="3"
              strokeDasharray={`${Math.min(costOverrunPct, 100) * 0.88} ${100}`} strokeLinecap="round"
              className="transition-all duration-700 ease-out" />
          </svg>
          <div className="absolute inset-0 grid place-items-center pointer-events-none">
            <div className="text-[10px] font-bold text-[var(--text-primary)] leading-none">{costOverrunPct.toFixed(1)}%</div>
          </div>
        </div>
      </div>
      <div className="mt-2.5 flex items-center gap-3 text-[8px] font-medium">
        <span className={`flex items-center gap-1 ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}><i className={`h-[5px] w-[5px] rounded-full ${profit >= 0 ? 'bg-emerald-500' : 'bg-rose-500'}`} /> Lợi nhuận {fmtNum(profit)} ({margin.toFixed(1)}%)</span>
        <span className="flex items-center gap-1 text-[var(--text-tertiary)]"><i className="h-[5px] w-[5px] rounded-full bg-[var(--text-tertiary)]/30" /> Chi phí {fmtNum(cost)} ({costPct.toFixed(1)}%)</span>
      </div>
    </div>
  );
}

// ─── Backward compat stubs ──────────────────────────────────
export function BOQVsActualChart({ data }: { data: any }) { return null; }
export function CostDistributionChart({ data }: { data: any }) { return null; }
export function ResourceUtilizationChart({ data }: { data: any }) { return null; }
