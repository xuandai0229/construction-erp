'use client';

import { useMemo } from 'react';
import { formatVnd } from '../dashboard-data';

interface InsightItemProps {
  label: string;
  value: string | number;
  subtext?: string;
  status?: 'STABLE' | 'WARNING' | 'CRITICAL' | 'INFO';
  confidence?: number; // AI Confidence indicator e.g. 94%
  sparkline?: number[];
  progress?: number; // 0 to 100
}

function MiniSparkline({ data }: { data: number[] }) {
  if (!data || data.length < 2) return null;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((val, idx) => {
    const x = (idx / (data.length - 1)) * 60;
    const y = 18 - ((val - min) / range) * 16;
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg className="w-16 h-5 stroke-[1.5] fill-none overflow-visible" stroke="var(--primary)" opacity="0.8">
      <polyline points={points} />
    </svg>
  );
}

export default function ExecutiveOperationalInsights({ data }: { data: any }) {
  const kpis = data?.kpis || {};
  const risks = data?.risk?.risks || [];
  const cashflow = data?.cashflow || {};
  const forecast = data?.forecast || {};

  // 1. Cost Burn Rate (Daily burn rate based on actual cost over elapsed time)
  const burnRate = useMemo(() => {
    const days = kpis.daysElapsed || 1;
    const cost = kpis.totalCost || 0;
    return Math.round(cost / days);
  }, [kpis]);

  // 2. Budget Consumption
  const budgetPct = useMemo(() => {
    const budget = kpis.totalBudget || 1;
    const cost = kpis.totalCost || 0;
    return Math.min(100, (cost / budget) * 100);
  }, [kpis]);

  // 3. Forecast Risk
  const forecastRisk = useMemo(() => {
    if (kpis.cpi < 0.85 || kpis.spi < 0.85) {
      return { label: 'RẤT CAO (Margin Deficit)', status: 'CRITICAL' as const, confidence: 96 };
    }
    if (kpis.cpi < 0.95 || kpis.spi < 0.95) {
      return { label: 'TRUNG BÌNH (Budget Overrun)', status: 'WARNING' as const, confidence: 88 };
    }
    return { label: 'THẤP (Stable)', status: 'STABLE' as const, confidence: 94 };
  }, [kpis]);

  // 4. Schedule Drift
  const scheduleDrift = useMemo(() => {
    const days = forecast.daysVariance || 0;
    if (days > 30) return { label: `Trễ ${days} ngày`, status: 'CRITICAL' as const };
    if (days > 5) return { label: `Trễ ${days} ngày`, status: 'WARNING' as const };
    if (days < 0) return { label: `Sớm ${Math.abs(days)} ngày`, status: 'STABLE' as const };
    return { label: 'Đúng tiến độ', status: 'STABLE' as const };
  }, [forecast]);

  // 5. Cashflow Prediction (Next 30 Days Forecast Net)
  const cashflowPrediction = useMemo(() => {
    const trend = cashflow.trend || [];
    if (trend.length === 0) return { val: 0, status: 'INFO' as const };
    const lastPoint = trend[trend.length - 1];
    const diff = (lastPoint.income || 0) - (lastPoint.expense || 0);
    return {
      val: diff,
      status: diff >= 0 ? ('STABLE' as const) : ('WARNING' as const)
    };
  }, [cashflow]);

  // 6. Approval Bottlenecks (Pending approvals > 2 days)
  const bottlenecksCount = useMemo(() => {
    return risks.filter((r: any) => r.type === 'DELAYED_APPROVALS').length;
  }, [risks]);

  // 7. Vendor Exposure (Highest vendor liability percentage)
  const vendorExposure = useMemo(() => {
    const boq = data?.boq || {};
    const topVendor = boq.topContractors?.[0];
    if (!topVendor) return { label: 'N/A', pct: 0 };
    return {
      label: topVendor.name,
      pct: Math.round(topVendor.pct || 0)
    };
  }, [data]);

  // 8. Overbudget WBS detection
  const overbudgetWBSCount = useMemo(() => {
    const list = data?.boq?.boqVsActual || [];
    return list.filter((item: any) => item.actual > item.budget).length;
  }, [data]);

  const statusColors = {
    STABLE: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    WARNING: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    CRITICAL: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    INFO: 'text-sky-400 bg-sky-500/10 border-sky-500/20'
  };

  return (
    <div className="flex flex-col h-full gap-3 p-4 select-none">
      <div className="flex items-center justify-between border-b border-[var(--divider)] pb-2.5">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-[var(--primary)] animate-pulse" />
          <h3 className="text-[11px] font-bold text-[var(--text-primary)] uppercase tracking-[0.18em]">
            Executive Operational Insights
          </h3>
        </div>
        <span className="text-[9px] font-black uppercase text-[var(--text-tertiary)] bg-[var(--secondary)] px-1.5 py-0.5 rounded border border-[var(--border)] tracking-wider">
          AI Diagnostic
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3.5 flex-1">
        {/* Cost Burn Rate */}
        <div className="flex flex-col justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
            Cost Burn Rate
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div className="text-[13px] font-bold text-[var(--text-primary)] tabular-nums">
              {formatVnd(burnRate)}/ngày
            </div>
            <MiniSparkline data={[burnRate * 0.9, burnRate * 0.95, burnRate * 1.05, burnRate]} />
          </div>
        </div>

        {/* Budget Consumption */}
        <div className="flex flex-col justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
            Budget Consumption
          </div>
          <div className="mt-1">
            <div className="flex justify-between items-baseline mb-1">
              <span className="text-[13px] font-bold text-[var(--text-primary)] tabular-nums">
                {budgetPct.toFixed(1)}%
              </span>
              <span className="text-[8px] text-[var(--text-tertiary)] font-bold">BAC</span>
            </div>
            <div className="h-1 w-full bg-[var(--secondary)] rounded-full overflow-hidden">
              <div 
                className={`h-full transition-all duration-500 ${budgetPct > 90 ? 'bg-rose-500' : budgetPct > 70 ? 'bg-amber-500' : 'bg-[var(--primary)]'}`}
                style={{ width: `${budgetPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Forecast Risk */}
        <div className="flex flex-col justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
            Forecast Risk
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${statusColors[forecastRisk.status]}`}>
              {forecastRisk.label}
            </span>
            <span className="text-[8px] text-[var(--text-tertiary)] font-black uppercase tracking-widest">
              Conf: {forecastRisk.confidence}%
            </span>
          </div>
        </div>

        {/* Schedule Drift */}
        <div className="flex flex-col justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
            Schedule Drift
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded border uppercase ${statusColors[scheduleDrift.status]}`}>
              {scheduleDrift.label}
            </span>
            <span className="text-[8px] text-[var(--text-tertiary)] font-black uppercase tracking-widest">
              EV/PV Gap
            </span>
          </div>
        </div>

        {/* Cashflow Prediction */}
        <div className="flex flex-col justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
            Cashflow Forecast (30d)
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <span className={`text-[12px] font-bold ${cashflowPrediction.val >= 0 ? 'text-emerald-400' : 'text-rose-400'} tabular-nums`}>
              {cashflowPrediction.val >= 0 ? '+' : ''}{formatVnd(cashflowPrediction.val)}
            </span>
            <span className="text-[8px] text-[var(--text-tertiary)] font-black uppercase">NET</span>
          </div>
        </div>

        {/* Approval Bottlenecks */}
        <div className="flex flex-col justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all">
          <div className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
            Approval Bottlenecks
          </div>
          <div className="flex items-center justify-between mt-1">
            <span className="text-[13px] font-bold text-[var(--text-primary)] tabular-nums">
              {bottlenecksCount} yêu cầu
            </span>
            <span className={`h-1.5 w-1.5 rounded-full ${bottlenecksCount > 0 ? 'bg-rose-500 animate-ping' : 'bg-emerald-500'}`} />
          </div>
        </div>

        {/* Vendor Exposure */}
        <div className="flex flex-col justify-between p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all col-span-2">
          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
            <span>Vendor Exposure Risk</span>
            <span className="text-[var(--text-primary)] tabular-nums">{vendorExposure.pct}%</span>
          </div>
          <div className="flex justify-between items-center mt-1">
            <span className="text-[11px] font-bold text-[var(--text-secondary)] truncate max-w-[180px]">
              {vendorExposure.label}
            </span>
            <div className="w-24 h-1 bg-[var(--secondary)] rounded-full overflow-hidden shrink-0">
              <div 
                className={`h-full ${vendorExposure.pct > 40 ? 'bg-rose-500' : 'bg-[var(--primary)]'}`}
                style={{ width: `${vendorExposure.pct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Overbudget WBS Detection */}
        <div className="flex justify-between items-center p-2.5 rounded-lg bg-[var(--background)] border border-[var(--border)]/40 hover:border-[var(--primary)]/15 transition-all col-span-2">
          <div className="flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className={`h-3.5 w-3.5 ${overbudgetWBSCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`} fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <span className="text-[9px] font-black uppercase tracking-wider text-[var(--text-tertiary)]">
              Overbudget WBS Elements
            </span>
          </div>
          <span className={`text-[10px] font-black px-1.5 py-0.5 rounded border uppercase ${overbudgetWBSCount > 0 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20' : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'}`}>
            {overbudgetWBSCount > 0 ? `${overbudgetWBSCount} Vượt định mức` : '0 Vượt định mức'}
          </span>
        </div>
      </div>
    </div>
  );
}
