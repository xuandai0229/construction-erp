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

function KPICard({ label, value, sub, type, accent = 'default', trendValue, trendUp }: KPICardProps) {
  const accentClasses = {
    default: 'border-l-[var(--brand)]',
    success: 'border-l-[var(--success)]',
    warning: 'border-l-[var(--warning)]',
    danger:  'border-l-[var(--danger)]',
    info:    'border-l-[var(--info)]',
  };

  const iconBgClasses = {
    default: 'bg-[var(--brand-light)] text-[var(--brand)]',
    success: 'bg-[var(--success-light)] text-[var(--success)]',
    warning: 'bg-[var(--warning-light)] text-[var(--warning)]',
    danger:  'bg-[var(--danger-light)] text-[var(--danger)]',
    info:    'bg-[var(--info-light)] text-[var(--info)]',
  };

  return (
    <article className={`kpi-card ${accentClasses[accent]}`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className={`flex h-8 w-8 items-center justify-center rounded-[6px] ${iconBgClasses[accent]}`}>
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              {KPI_ICONS[type]}
            </svg>
          </div>
          <div className="t-kpi-label">{label}</div>
        </div>
      </div>
      
      <div className="flex flex-col gap-0.5">
        <div className="t-kpi-value text-[22px]">
          {formatVnd(value)} <span className="text-[11px] font-medium text-[var(--text-muted)] ml-0.5">VND</span>
        </div>
        
        <div className="flex items-center gap-2">
          {trendValue && (
            <div className={`flex items-center gap-0.5 text-[11px] font-bold ${trendUp ? 'text-[var(--success)]' : 'text-[var(--danger)]'}`}>
              <TrendIcon up={trendUp} />
              {trendValue}
            </div>
          )}
          {sub && (
            <div className="text-[11px] font-medium text-[var(--text-secondary)] truncate">
              {sub}
            </div>
          )}
        </div>
      </div>
    </article>
  );
}

export default function KPISection({ data }: { data: DashboardData }) {
  const totalBudget  = data.budget.reduce((s, r) => s + r.estimatedAmount, 0);
  const totalCost    = data.costs.reduce((s, r) => s + r.amount, 0);
  const profit       = data.revenue - totalCost;
  const margin       = data.revenue > 0 ? (profit / data.revenue) * 100 : 0;
  const contractVal  = data.project?.totalValue ?? 0;

  return (
    <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-[var(--sp-16)]">
      <KPICard
        type="contract"
        label="Giá trị hợp đồng"
        value={contractVal}
        sub="0% so với kế hoạch"
        accent="info"
      />
      <KPICard
        type="budget"
        label="Tổng dự toán"
        value={totalBudget}
        trendValue="5.6%"
        trendUp={true}
        sub="so với hợp đồng"
        accent="info"
      />
      <KPICard
        type="cost"
        label="Chi phí thực tế"
        value={totalCost}
        trendValue="12.5%"
        trendUp={false}
        sub="so với dự toán"
        accent="danger"
      />
      <KPICard
        type="profit"
        label="Lợi nhuận (Lãi/Lỗ)"
        value={profit}
        trendValue="8.8%"
        trendUp={true}
        sub={`Biên: ${margin.toFixed(1)}%`}
        accent="success"
      />
      <KPICard
        type="receivable"
        label="Công nợ phải thu"
        value={data.receivable.total}
        trendValue="3.2%"
        trendUp={false}
        sub="so với kỳ trước"
        accent="danger"
      />
      <KPICard
        type="payable"
        label="Công nợ phải trả"
        value={data.payable.total}
        trendValue="-2.1%"
        trendUp={true}
        sub="so với kỳ trước"
        accent="success"
      />
    </section>
  );
}
