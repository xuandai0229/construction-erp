'use client';

import { DashboardData, formatShortVnd, formatVnd } from './dashboard-data';

export default function ProfitPanel({ data }: { data: DashboardData }) {
  const cost    = data.totalActual;
  const revenue = data.project?.totalValue ?? 0;
  const profit  = revenue - cost;
  const margin  = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  return (
    <div className="erp-card flex flex-col h-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ height: '44px', padding: '0 var(--sp-12)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LÃI LỖ DỰ ÁN</h3>
      </div>
      <div style={{ padding: 'var(--sp-12)', display: 'flex', flexDirection: 'column', gap: 'var(--sp-12)', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <MetricRow label="Doanh thu" value={revenue} />
          <MetricRow label="Tổng chi phí" value={cost} />
          <MetricRow label="Lợi nhuận" value={profit} color="var(--success)" bold />
          <MetricRow label="Tỷ lệ lợi nhuận" value={`${margin.toFixed(1)}%`} isValueString color="var(--success)" bold />
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid var(--bg-muted)', paddingTop: '12px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ position: 'relative', width: '60px', height: '60px', flexShrink: 0 }}>
             <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--bg-muted)" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="var(--brand)" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 28 * Math.max(0, margin) / 100} 200`} strokeLinecap="round" />
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, color: 'var(--brand)' }}>
                {margin.toFixed(0)}%
             </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)' }} />
                   <span style={{ color: 'var(--text-secondary)' }}>Lợi nhuận</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatShortVnd(profit)}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--bg-muted)' }} />
                   <span style={{ color: 'var(--text-secondary)' }}>Chi phí</span>
                </div>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatShortVnd(cost)}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color, bold, isValueString }: { label: string; value: any; color?: string; bold?: boolean; isValueString?: boolean }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
      <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
      <span style={{ 
        fontWeight: bold ? 700 : 600, 
        color: color || 'var(--text-primary)', 
        fontVariantNumeric: 'tabular-nums'
      }}>
        {isValueString ? value : formatVnd(value)}
      </span>
    </div>
  );
}
