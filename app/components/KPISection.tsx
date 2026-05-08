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

function KPICard({ label, value, sub, type, trendValue, trendUp }: KPICardProps) {
  const iconColors = {
    contract: 'var(--brand)',
    budget: '#9333EA',
    cost: '#EA580C',
    profit: 'var(--success)',
    receivable: 'var(--danger)',
    payable: 'var(--info)',
  };

  return (
    <article className="erp-card" style={{ 
      padding: 'var(--sp-12) var(--sp-16)', 
      display: 'flex', 
      alignItems: 'center', 
      gap: 'var(--sp-16)',
      minHeight: '84px',
      background: 'var(--bg-surface)',
      border: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div style={{ 
        width: '40px', 
        height: '40px', 
        borderRadius: '50%', 
        background: 'var(--bg-subtle)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        flexShrink: 0,
        color: (iconColors as any)[type] || 'var(--brand)'
      }}>
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          {KPI_ICONS[type]}
        </svg>
      </div>
      
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.02em', marginBottom: '2px' }}>{label}</div>
        <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
          {formatVnd(value)}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
          {trendValue && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '10px', fontWeight: 700, color: trendUp ? 'var(--success)' : 'var(--danger)' }}>
              <TrendIcon up={!!trendUp} />
              {trendValue}
            </div>
          )}
          <div style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{sub}</div>
        </div>
      </div>
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

  const costTrend = getTrend('cost');
  const revTrend = getTrend('revenue');

  const totalBudget  = data.totalBudget;
  const totalCost    = data.totalActual;
  const profit       = (data.project?.totalValue ?? 0) - totalCost;
  const contractVal  = data.project?.totalValue ?? 0;
  const margin       = contractVal > 0 ? (profit / contractVal) * 100 : 0;

  return (
    <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-6">
      <KPICard
        type="contract"
        label="Tổng giá trị HĐ"
        value={contractVal}
        sub="0% so với kế hoạch"
      />
      <KPICard
        type="budget"
        label="Tổng dự toán"
        value={totalBudget}
        trendValue="5.6%"
        trendUp={true}
        sub="so với hợp đồng"
      />
      <KPICard
        type="cost"
        label="Tổng chi phí thực tế"
        value={totalCost}
        trendValue="12.5%"
        trendUp={false} 
        sub="so với dự toán"
      />
      <KPICard
        type="profit"
        label="Lợi nhuận (Lãi/Lỗ)"
        value={profit}
        trendValue="8.8%"
        trendUp={true}
        sub={`Biên: ${margin.toFixed(1)}%`}
      />
      <KPICard
        type="receivable"
        label="Công nợ phải thu"
        value={data.receivable.total}
        trendValue="3.2%"
        trendUp={false}
        sub="so với kỳ trước"
      />
      <KPICard
        type="payable"
        label="Công nợ phải trả"
        value={data.payable.total}
        trendValue="2.1%"
        trendUp={true}
        sub="so với kỳ trước"
      />
    </section>
  );
}
