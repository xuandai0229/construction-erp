'use client';

import { DashboardData, formatVnd } from './dashboard-data';

const KPI_ICONS = {
  contract: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 12V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2h7m9-9l-9 9m9-9l-9-9m9 9H9" />
  ),
  budget: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  ),
  cost: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  ),
  profit: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  ),
  receivable: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
  ),
  payable: (
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  ),
};

function TrendIcon({ up }: { up: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3" fill="none" stroke="currentColor" strokeWidth="3">
      {up
        ? <path strokeLinecap="round" strokeLinejoin="round" d="M7 17L17 7M7 7h10v10" />
        : <path strokeLinecap="round" strokeLinejoin="round" d="M7 7l10 10M17 7v10H7" />
      }
    </svg>
  );
}

interface KPICardProps {
  label:   string;
  value:   number;
  sub?:    string;
  type:    keyof typeof KPI_ICONS;
  accent?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  trendValue?: string;
  trendUp?: boolean;
}

function KPICard({ label, value, sub, type }: KPICardProps) {
  const accent: Record<string, string> = {
    contract: '#2563eb',      // blue
    budget: '#6D28D9',        // indigo/purple
    cost: '#EA580C',          // amber/orange-red
    profit: '#16A34A',        // green
    receivable: '#F59E0B',   // amber
    payable: '#3B82F6',      // blue
  };

  const iconBg: Record<string, string> = {
    contract: 'rgba(37, 99, 235, 0.10)',
    budget: 'rgba(109, 40, 217, 0.10)',
    cost: 'rgba(234, 88, 12, 0.10)',
    profit: 'rgba(22, 163, 74, 0.10)',
    receivable: 'rgba(245, 158, 11, 0.10)',
    payable: 'rgba(59, 130, 246, 0.10)',
  };

  const safeValue = Number.isFinite(value) ? value : 0;
  const a = accent[type] ?? '#2563eb';

  const accentKey = type === 'profit'
    ? 'success'
    : type === 'cost' || type === 'receivable'
      ? 'warning'
      : type === 'contract' || type === 'payable'
        ? 'info'
        : 'info';

  return (
    <article
      className="erp-card erp-card-exec-top erp-card-exec-gradient"
      data-accent={accentKey}
      style={{
        padding: '12px 14px',
        display: 'grid',
        gridTemplateColumns: '44px 1fr',
        columnGap: '12px',
        minHeight: '84px',
        background: 'var(--bg-surface)',
        border: `1px solid rgba(229, 231, 235, 0.9)`,
        boxShadow: 'var(--shadow-kpi)',
        borderRadius: '12px',
        cursor: 'default',
        position: 'relative',
      }}
    >
      {/* Stronger, premium icon container */}
      <div
        style={{
          width: '44px',
          height: '44px',
          borderRadius: '12px',
          background: iconBg[type] ?? 'rgba(37, 99, 235, 0.10)',
          border: '1px solid rgba(148, 163, 184, 0.35)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: a,
          flexShrink: 0,
          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.04)',
          transform: 'translateZ(0)',
        }}
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2.2">
          {KPI_ICONS[type]}
        </svg>
      </div>

      <div style={{ minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {/* label: quieter */}
        <div
          style={{
            fontSize: '10px',
            fontWeight: 800,
            color: '#64748b',
            textTransform: 'uppercase',
            letterSpacing: '0.09em',
            marginBottom: '3px',
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={label}
        >
          {label}
        </div>

        {/* value: dominate */}
        <div
          style={{
            fontSize: '24px',
            fontWeight: 950,
            color: '#0B1220',
            fontVariantNumeric: 'tabular-nums',
            lineHeight: 1.05,
            letterSpacing: '-0.02em',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
          title={formatVnd(safeValue)}
        >
          {formatVnd(safeValue)}
        </div>

        {/* meta: quieter + aligned */}
        <div
          style={{
            marginTop: '6px',
            display: 'grid',
            gridTemplateColumns: 'auto 1fr',
            alignItems: 'center',
            columnGap: '10px',
          }}
        >
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '4px',
              background: a,
              opacity: 0.95,
              boxShadow: '0 6px 16px rgba(15, 23, 42, 0.06)',
            }}
            aria-hidden="true"
          />
          <div
            style={{
              fontSize: '10px',
              color: '#94a3b8',
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              lineHeight: 1.2,
              textTransform: 'none',
            }}
            title={sub}
          >
            {sub}
          </div>
        </div>
      </div>

      {/* subtle internal top highlight for executive depth */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          borderRadius: '12px',
          boxShadow: `inset 0 1px 0 rgba(255,255,255,0.65)`,
        }}
      />
    </article>
  );
}


export default function KPISection({ data }: { data: DashboardData }) {
  const trends = data.monthlyTrends || [];
  const latest = trends[trends.length - 1];
  const previous = trends[trends.length - 2];

  const getTrend = (key: 'revenue' | 'cost') => {
    if (!latest || !previous || previous[key] === 0) return null;
    const diff = ((latest[key] - previous[key]) / previous[key]) * 100;
    return {
      val: `${Math.abs(diff).toFixed(1)}%`,
      up: diff > 0
    };
  };



  const totalBudget  = data.totalBudget;
  const totalCost    = data.totalActual;
  const profit       = (data.project?.totalValue ?? 0) - totalCost;
  const contractVal  = data.project?.totalValue ?? 0;
  const margin       = contractVal > 0 ? (profit / contractVal) * 100 : 0;

  // Executive KPI composition (weighted dominance, still ERP-grid discipline).
  // Primary: Contract Value + Profit
  // Medium: Project Progress
  // Compact: Budget, Cost, AR/AP
  const progressValue = typeof data.progress === 'number' ? data.progress : 0;

  return (
    <section
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 1fr)',
        gap: 'var(--sp-12)',
      }}
    >
      {/* Row 1 (dominant): Contract Value + Profit */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: 'var(--sp-12)' }}>
        <div style={{ transform: 'translateY(-1px)' }}>
          <KPICard
            type="contract"
            label="Contract Value"
            value={contractVal}
            sub="Planned / Award"
          />
        </div>
        <div>
          <KPICard
            type="profit"
            label="Profit"
            value={profit}
            sub={`Margin ${margin.toFixed(1)}%`}
          />
        </div>
      </div>

      {/* Row 2 (medium): Project progress dominates the grid breathing */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-12)' }}>
        <div style={{ gridColumn: 'span 1' }}>
          <KPICard
            type="budget"
            label="Project Progress"
            value={progressValue}
            sub="% Complete"
          />
        </div>

        {/* Compact supporting metrics (keep operational density) */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-12)' }}>
          <KPICard type="budget" label="Budget" value={totalBudget} sub="Total Forecast" />
          <KPICard type="cost" label="Actual Cost" value={totalCost} sub="Total Actual" />
          <KPICard type="receivable" label="AR" value={data.receivable.total} sub="Outstanding" />
          <KPICard type="payable" label="AP" value={data.payable.total} sub="Payables" />
        </div>
      </div>
    </section>
  );
}
