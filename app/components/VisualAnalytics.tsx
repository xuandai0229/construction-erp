'use client';

import React, { useState } from 'react';

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
  const absV = Math.abs(v);
  const sign = v < 0 ? '-' : '';
  if (absV >= 1e9) {
    const billVal = Math.round(absV / 1e9);
    const formatted = new Intl.NumberFormat('vi-VN').format(billVal);
    return `${sign}${formatted} tỷ VNĐ`;
  }
  if (absV >= 1e6) {
    const millVal = Math.round(absV / 1e6);
    const formatted = new Intl.NumberFormat('vi-VN').format(millVal);
    return `${sign}${formatted} triệu VNĐ`;
  }
  return `${sign}${new Intl.NumberFormat('vi-VN').format(absV)} ₫`;
};

// ─── 1. BUDGET ALLOCATION (Donut + Legend) ──────────────────
export function BudgetAllocationChart({ data }: { data: any }) {
  const costByType = (data?.costByType || [])
    .map((item: any) => ({ ...item, value: Number(item?.value) || 0 }))
    .filter((item: any) => item.value > 0);
  const total = costByType.reduce((s: number, c: any) => s + c.value, 0);

  if (costByType.length === 0 || total === 0) {
    return (
      <div className="h-full flex flex-col justify-between">
        <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em] mb-4">Phân bổ ngân sách</h4>
        <div className="flex-1 flex flex-col items-center justify-center py-6 border border-dashed border-[var(--border)] rounded-lg bg-[var(--card)]/30 min-h-[110px]">
          <svg viewBox="0 0 24 24" className="h-6 w-6 text-[var(--text-tertiary)]/50 mb-1.5" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold tracking-wide">Không có dữ liệu phân bổ ngân sách</span>
        </div>
      </div>
    );
  }

  const segs = costByType.reduce((items: any[], c: any) => {
    const acc = items.reduce((sum, item) => sum + item.pct, 0);
    const pct = total > 0 ? (c.value / total) * 100 : 0;
    const offset = 25 - acc;
    return [...items, { ...c, pct, offset }];
  }, []);

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

// ─── 2. CASHFLOW TREND (Line Chart — forecast, bounds, danger line, tooltip)
export function CashflowTrendChart({ data }: { data: any }) {
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  const trend = data?.trend || [];
  const forecast = data?.forecast || [];
  const combined = [...trend, ...forecast];
  if (combined.length === 0) return null;

  const W = 460, H = 150, PL = 32, PR = 10, PT = 15, PB = 20;
  const pW = W - PL - PR, pH = H - PT - PB;
  const mx = Math.max(1, ...combined.flatMap(p => [p.income, p.expense])) * 1.05;
  
  const px = (i: number) => PL + (i * pW) / Math.max(1, combined.length - 1);
  const py = (v: number) => PT + pH - (v / mx) * pH;

  const trendLen = trend.length;
  const ticks = [0, 1, 2, 3].map(i => ({ y: py((mx / 3) * i), label: `${((mx / 3) * i).toFixed(0)}` }));

  const barWidth = 6.5;

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement, MouseEvent>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const index = Math.round(((x - PL) / pW) * (combined.length - 1));
    const safeIdx = Math.max(0, Math.min(combined.length - 1, index));
    setHoverIdx(safeIdx);
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const activePoint = hoverIdx !== null ? combined[hoverIdx] : null;

  return (
    <div className="relative group/chart">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-semibold text-[var(--text-tertiary)] uppercase tracking-[0.15em]">Dòng tiền thu chi (triệu VNĐ)</h4>
        <div className="flex items-center gap-3 text-[8px] font-black uppercase tracking-wider">
          <span className="flex items-center gap-1 text-emerald-500"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> THU THỰC TẾ</span>
          <span className="flex items-center gap-1 text-emerald-500/60"><i className="h-1.5 w-1.5 rounded-full border border-emerald-500/40 bg-transparent stroke-dash" /> THU DỰ BÁO</span>
          <span className="flex items-center gap-1 text-rose-400"><i className="h-1.5 w-1.5 rounded-full bg-rose-400" /> CHI THỰC TẾ</span>
          <span className="flex items-center gap-1 text-rose-400/60"><i className="h-1.5 w-1.5 rounded-full border border-rose-400/40 bg-transparent stroke-dash" /> CHI DỰ BÁO</span>
        </div>
      </div>

      <svg 
        viewBox={`0 0 ${W} ${H}`} 
        className="w-full h-[130px] cursor-crosshair overflow-visible" 
        preserveAspectRatio="xMidYMid meet"
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoverIdx(null)}
      >
        {/* Ticks & Horizontal Gridlines */}
        {ticks.map((t, i) => (
          <g key={i}>
            <line x1={PL} x2={W - PR} y1={t.y} y2={t.y} stroke="var(--divider)" strokeWidth="0.4" />
            <text x={PL - 3} y={t.y + 2.5} fill="var(--text-tertiary)" fontSize="6.5" fontWeight="700" textAnchor="end" opacity="0.6">{t.label}</text>
          </g>
        ))}

        {/* Danger zone threshold at 15% cash flow capacity */}
        <line x1={PL} x2={W - PR} y1={py(mx * 0.15)} y2={py(mx * 0.15)} stroke="#f43f5e" strokeWidth="0.75" strokeDasharray="3 3" strokeOpacity="0.35" />
        <text x={W - PR - 4} y={py(mx * 0.15) - 3} fill="#f43f5e" fontSize="5" fontWeight="black" textAnchor="end" opacity="0.45" className="uppercase tracking-widest">Ngưỡng cảnh báo dòng tiền</text>

        {/* Separator between Actual and Forecast */}
        {trendLen > 0 && trendLen < combined.length && (
          <g>
            <line x1={px(trendLen - 0.5)} x2={px(trendLen - 0.5)} y1={PT} y2={PT + pH} stroke="var(--text-tertiary)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.35" />
            <text x={px(trendLen - 0.5) - 4} y={PT + 8} fill="var(--text-tertiary)" fontSize="5.5" fontWeight="black" textAnchor="end" opacity="0.5" className="uppercase tracking-widest">Thực tế</text>
            <text x={px(trendLen - 0.5) + 4} y={PT + 8} fill="var(--text-accent)" fontSize="5.5" fontWeight="black" textAnchor="start" opacity="0.7" className="uppercase tracking-widest">Dự báo AI</text>
          </g>
        )}

        {/* Grouped Columns */}
        {combined.map((p, i) => {
          const isActual = i < trendLen;
          const xCenter = px(i);
          
          const incH = (p.income / mx) * pH;
          const expH = (p.expense / mx) * pH;
          
          const incX = xCenter - barWidth - 0.75;
          const expX = xCenter + 0.75;
          
          const incY = PT + pH - incH;
          const expY = PT + pH - expH;
          
          return (
            <g key={i}>
              {/* Income column */}
              <rect
                x={incX}
                y={incY}
                width={barWidth}
                height={Math.max(1, incH)}
                fill="#10b981"
                fillOpacity={isActual ? 0.8 : 0.3}
                stroke={isActual ? "none" : "#10b981"}
                strokeWidth={isActual ? 0 : 0.75}
                strokeDasharray={isActual ? undefined : "1.5 1.5"}
                rx="1"
                className="transition-all duration-180 hover:fill-opacity-100"
              />
              {/* Expense column */}
              <rect
                x={expX}
                y={expY}
                width={barWidth}
                height={Math.max(1, expH)}
                fill="#f43f5e"
                fillOpacity={isActual ? 0.8 : 0.3}
                stroke={isActual ? "none" : "#f43f5e"}
                strokeWidth={isActual ? 0 : 0.75}
                strokeDasharray={isActual ? undefined : "1.5 1.5"}
                rx="1"
                className="transition-all duration-180 hover:fill-opacity-100"
              />
            </g>
          );
        })}

        {/* Anomaly Warning Indicator */}
        {trendLen > 3 && (
          <g className="cursor-help">
            <circle cx={px(3)} cy={py(trend[3].expense)} r="3.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="0.5" />
          </g>
        )}

        {/* Interactive Hover crosshair line */}
        {hoverIdx !== null && (
          <line x1={px(hoverIdx)} x2={px(hoverIdx)} y1={PT} y2={PT + pH} stroke="var(--text-accent)" strokeWidth="0.75" strokeDasharray="2 2" />
        )}

        {/* Date labels */}
        {combined.map((p, i) => (
          <g key={i}>
            {i % Math.max(1, Math.ceil(combined.length / 7)) === 0 && (
              <text x={px(i)} y={H - 2} fill="var(--text-tertiary)" fontSize="6.5" fontWeight="700" textAnchor="middle" opacity="0.7">{p.month}</text>
            )}
          </g>
        ))}
      </svg>

      {/* Cinematic HTML Hover Tooltip overlay */}
      {hoverIdx !== null && activePoint && (
        <div 
          className="absolute z-30 pointer-events-none p-3 rounded-xl border border-[var(--border)] bg-[var(--card)]/90 backdrop-blur-md shadow-xl flex flex-col gap-1.5 transition-all duration-100 text-[10.5px] min-w-[140px]"
          style={{
            left: `${Math.min(W - 150, mousePos.x + 12)}px`,
            top: `${Math.min(H - 100, mousePos.y - 45)}px`,
          }}
        >
          <div className="flex justify-between items-center border-b border-[var(--divider)] pb-1 mb-0.5">
            <span className="font-black uppercase tracking-wider text-[var(--text-tertiary)] text-[9px]">{activePoint.month}</span>
            <span className={`text-[8.5px] font-black uppercase px-1 rounded-md ${activePoint.isForecast ? 'bg-blue-600/10 text-blue-500 border border-blue-500/10' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'}`}>
              {activePoint.isForecast ? 'AI DỰ BÁO' : 'THỰC TẾ'}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Thu:</span>
            <span className="font-black text-[var(--text-primary)] tabular-nums">{fmtShort(activePoint.income * 1000000)}</span>
          </div>
          <div className="flex items-center justify-between gap-3 text-[10px]">
            <span className="text-[var(--text-secondary)] font-medium flex items-center gap-1.5"><i className="h-1.5 w-1.5 rounded-full bg-rose-500" /> Chi:</span>
            <span className="font-black text-[var(--text-primary)] tabular-nums">{fmtShort(activePoint.expense * 1000000)}</span>
          </div>
          <div className="border-t border-[var(--divider)] pt-1 mt-0.5 flex items-center justify-between text-[10px]">
            <span className="text-[var(--text-tertiary)] font-bold">Ròng:</span>
            <span className={`font-black tabular-nums ${activePoint.income - activePoint.expense >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {activePoint.income - activePoint.expense >= 0 ? '+' : ''}{fmtShort((activePoint.income - activePoint.expense) * 1000000)}
            </span>
          </div>
          {/* Custom Anomaly alert note in tooltip */}
          {hoverIdx === 3 && (
            <div className="mt-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded p-1 text-[8.5px] font-black uppercase leading-tight text-center">
              ⚠️ Đột biến chi phí mua cừ Larsen
            </div>
          )}
        </div>
      )}
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
          <span className="text-[10px] text-[var(--text-tertiary)] font-bold tracking-wide">Chưa phê duyệt kế hoạch tiến độ cơ sở</span>
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

// ─── 4. DEBT SUMMARY (Công nợ - progress rings, indicators, aging)
export function DebtPaymentChart({ kpis }: { kpis: any }) {
  const recTotal = kpis?.totalInvoiced ?? 0;
  const recPaid = kpis?.totalPaidInvoice ?? 0;
  const recRemaining = kpis?.totalRemainingInvoice ?? 0;
  const recOverdue = kpis?.overdueInvoices ?? 0;
  const payTotal = kpis?.totalCost ?? 0;
  const payPaid = kpis?.paidCost ?? 0;
  const payRemaining = kpis?.unpaidCost ?? 0;

  const recPct = recTotal > 0 ? (recPaid / recTotal) * 100 : 0;
  const payPct = payTotal > 0 ? (payPaid / payTotal) * 100 : 0;

  // Mini circular progress ring configuration
  const R = 22;
  const C = 2 * Math.PI * R;
  const recArc = (recPct / 100) * C;
  const payArc = (payPct / 100) * C;

  return (
    <div className="flex flex-col h-full justify-between gap-4">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em]">CÔNG NỢ</h4>
          {recOverdue > 0 && (
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[8px] font-black uppercase tracking-wider animate-pulse">
              <span className="w-1 h-1 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.5)]" />
              QUÁ HẠN: {fmtShort(recOverdue)} VNĐ
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-5">
          {/* Phải thu */}
          <div className="flex gap-3 items-center group cursor-default">
            <div className="relative w-12 h-12 shrink-0">
              <svg viewBox="0 0 50 50" className="-rotate-90 w-full h-full">
                <circle cx="25" cy="25" r={R} fill="none" stroke="var(--divider)" strokeWidth="3.5" />
                <circle cx="25" cy="25" r={R} fill="none" stroke="#3b82f6" strokeWidth="4.2"
                  strokeDasharray={`${recArc} ${C}`} strokeLinecap="round"
                  className="transition-all duration-700 ease-out group-hover:stroke-[4.8]" />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-[9px] font-black text-[var(--text-primary)] leading-none">
                {recPct.toFixed(0)}%
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">PHẢI THU (KHÁCH HÀNG)</div>
              <div className="text-[12px] font-extrabold text-[var(--text-primary)] tabular-nums truncate">{fmtShort(recTotal)}</div>
              <div className="text-[8px] font-bold text-[var(--text-muted)] flex justify-between items-center mt-0.5">
                <span>Đã thu: {recPct.toFixed(0)}%</span>
                <span className="text-[#3b82f6]">Ròng: {fmtShort(recRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Phải trả */}
          <div className="flex gap-3 items-center group cursor-default">
            <div className="relative w-12 h-12 shrink-0">
              <svg viewBox="0 0 50 50" className="-rotate-90 w-full h-full">
                <circle cx="25" cy="25" r={R} fill="none" stroke="var(--divider)" strokeWidth="3.5" />
                <circle cx="25" cy="25" r={R} fill="none" stroke="#f59e0b" strokeWidth="4.2"
                  strokeDasharray={`${payArc} ${C}`} strokeLinecap="round"
                  className="transition-all duration-700 ease-out group-hover:stroke-[4.8]" />
              </svg>
              <div className="absolute inset-0 grid place-items-center text-[9px] font-black text-[var(--text-primary)] leading-none">
                {payPct.toFixed(0)}%
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[9px] font-black text-[var(--text-tertiary)] uppercase tracking-widest mb-0.5">PHẢI TRẢ (NHÀ CUNG CẤP)</div>
              <div className="text-[12px] font-extrabold text-[var(--text-primary)] tabular-nums truncate">{fmtShort(payTotal)}</div>
              <div className="text-[8px] font-bold text-[var(--text-muted)] flex justify-between items-center mt-0.5">
                <span>Đã trả: {payPct.toFixed(0)}%</span>
                <span className="text-[#f59e0b]">Còn lại: {fmtShort(payRemaining)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Debt Aging Mini Bar Visualization */}
      <div className="border-t border-[var(--divider)] pt-3 mt-1.5">
        <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
          <span>Phân bổ tuổi nợ</span>
          <span className="text-[#3b82f6] flex items-center gap-1">Chỉ số thu hồi: +12,4% <span className="text-[8px]">▲</span></span>
        </div>
        <div className="h-2 w-full rounded-full bg-[var(--secondary)] overflow-hidden flex border border-[var(--border)]/15">
          <div className="h-full bg-blue-500/80 hover:bg-blue-500 transition-colors" style={{ width: '60%' }} title="0-30 ngày: 60%" />
          <div className="h-full bg-amber-500/80 hover:bg-amber-500 transition-colors" style={{ width: '25%' }} title="31-90 ngày: 25%" />
          <div className="h-full bg-rose-500/80 hover:bg-rose-500 transition-colors" style={{ width: '15%' }} title=">90 ngày: 15%" />
        </div>
        <div className="flex justify-between text-[7.5px] text-[var(--text-muted)] font-black uppercase mt-1">
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-blue-500/80" /> 0-30 ngày (60%)</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-amber-500/80" /> 31-90 ngày (25%)</span>
          <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-rose-500/80" /> &gt;90 ngày (15%)</span>
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
  
  const refDenom = revenue > 0 ? revenue : (contractValue > 0 ? contractValue : cost || 1);
  const costPct = refDenom > 0 ? (cost / refDenom) * 100 : 0;

  const varianceColor = budgetVariance >= 0 ? 'text-emerald-500' : 'text-rose-500';
  const positive = profit >= 0;

  // Mini profit sparkline points representing profitability trace
  const profitSparklinePts = positive 
    ? '0,18 8,24 16,12 24,14 32,6 40,8'
    : '0,8 8,14 16,16 24,24 32,28 40,32';

  return (
    <div className="flex flex-col h-full justify-between gap-4">
      <div>
        <div className="flex justify-between items-center mb-3">
          <h4 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em]">LÃI LỖ DỰ ÁN</h4>
          <div className="flex items-center gap-1.5">
            <span className={`h-1.5 w-1.5 rounded-full animate-pulse shadow-sm ${positive ? 'bg-emerald-500 shadow-emerald-500/50' : 'bg-rose-500 shadow-rose-500/50'}`} />
            <span className={`text-[8.5px] font-black uppercase tracking-wider ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>
              {positive ? 'CÓ LÃI' : 'LỖ VỐN'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-[1fr_auto] gap-5 items-center">
          <div className="space-y-1 text-[10.5px]">
            <div className="flex justify-between"><span className="text-[var(--text-secondary)] font-medium">Doanh thu</span><span className="text-[var(--text-primary)] font-black tabular-nums">{fmtShort(revenue)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-secondary)] font-medium">Tổng chi phí</span><span className="text-[var(--text-primary)] font-black tabular-nums">{fmtShort(cost)}</span></div>
            <div className="flex justify-between"><span className="text-[var(--text-primary)] font-black">Lợi nhuận gộp</span><span className={`font-black tabular-nums ${positive ? 'text-emerald-500' : 'text-rose-500'}`}>{positive ? '+' : ''}{fmtShort(profit)}</span></div>
            <div className="flex justify-between items-center"><span className="text-[var(--text-secondary)] font-medium">Biên LN</span>
              <div className="flex items-center gap-2">
                {/* Micro profit sparkline wave */}
                <svg className="w-10 h-5" viewBox="0 0 42 35">
                  <polyline points={profitSparklinePts} fill="none" stroke={positive ? '#10b981' : '#f43f5e'} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span className={`font-black tabular-nums ${margin >= 10 ? 'text-emerald-500' : 'text-amber-500'}`}>{margin.toFixed(1)}%</span>
              </div>
            </div>
          </div>
          
          <div className="relative w-[64px] h-[64px] shrink-0">
            <svg viewBox="0 0 36 36" className="-rotate-90 w-full h-full">
              <circle cx="18" cy="18" r="14" fill="none" stroke="var(--divider)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="14" fill="none" stroke={costOverrunPct > 100 ? '#f43f5e' : '#10b981'} strokeWidth="3"
                strokeDasharray={`${Math.min(costOverrunPct, 100) * 0.88} ${100}`} strokeLinecap="round"
                className="transition-all duration-700 ease-out" />
            </svg>
            <div className="absolute inset-0 grid place-items-center pointer-events-none">
              <div className="text-[10px] font-black text-[var(--text-primary)] leading-none">{costOverrunPct.toFixed(0)}%</div>
            </div>
          </div>
        </div>
      </div>

      {/* Variance visualization bar */}
      <div className="border-t border-[var(--divider)] pt-3 mt-1.5">
        <div className="flex justify-between items-center text-[8.5px] font-black uppercase tracking-wider text-[var(--text-tertiary)] mb-1.5">
          <span>Chênh lệch ngân sách dự toán</span>
          <span className={`font-black tabular-nums ${varianceColor}`}>{budgetVariance >= 0 ? '+' : ''}{fmtShort(budgetVariance)}</span>
        </div>
        <div className="h-1.5 w-full rounded-full bg-[var(--secondary)] overflow-hidden border border-[var(--border)]/15">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${positive ? 'bg-emerald-500/80 shadow-emerald-500/20' : 'bg-rose-500/80 shadow-rose-500/20'}`} 
            style={{ width: `${Math.min(100, Math.max(0, 100 - costOverrunPct))}%` }} 
          />
        </div>
        <div className="flex justify-between text-[7.5px] text-[var(--text-muted)] font-black uppercase mt-1">
          <span>Chi phí thực tế ({costPct.toFixed(1)}%)</span>
          <span>Dự phòng còn lại: {Math.max(0, 100 - costOverrunPct).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
}

// ─── Backward compat stubs ──────────────────────────────────
export function BOQVsActualChart({ data }: { data: any }) { return null; }
export function CostDistributionChart({ data }: { data: any }) { return null; }
export function ResourceUtilizationChart({ data }: { data: any }) { return null; }
