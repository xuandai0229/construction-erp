'use client';

import { DashboardData, formatShortVnd, formatVnd } from './dashboard-data';

export default function ProfitPanel({ data }: { data: DashboardData }) {
  const cost    = data.totalActual;
  const revenue = data.project?.totalValue ?? 0;
  const profit  = revenue - cost;
  const margin  = revenue > 0 ? (profit / revenue) * 100 : 0;
  
  const sanitizeValue = (val: any) => {
    if (val === null || val === undefined || val !== val) return 0;
    return val;
  };
  
  return (
    <div className="erp-card flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)', borderRadius: '12px' }}>
      <div style={{ height: '40px', padding: '0 16px', borderBottom: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg, #f9fafb 0%, #f0f1f5 100%)' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Lãi lỗ dự án</h3>
      </div>
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <MetricRow label="Doanh thu" value={sanitizeValue(revenue)} />
          <MetricRow label="Tổng chi phí" value={sanitizeValue(cost)} />
          <MetricRow label="Lợi nhuận" value={sanitizeValue(profit)} color="#10B981" bold />
          <MetricRow label="Biên lợi nhuận" value={`${Number.isFinite(margin) ? margin.toFixed(1) : '0'}%`} isValueString color="#10B981" bold />
        </div>

        <div style={{ marginTop: 'auto', borderTop: '1px solid #e5e7eb', paddingTop: '10px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ position: 'relative', width: '56px', height: '56px', flexShrink: 0 }}>
             <svg viewBox="0 0 64 64" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                <circle cx="32" cy="32" r="28" fill="none" stroke="#10B981" strokeWidth="6" strokeDasharray={`${2 * Math.PI * 28 * Math.max(0, Math.min(margin, 100)) / 100} 200`} strokeLinecap="round" strokeLinejoin="round" />
             </svg>
             <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800, color: '#10B981' }}>
                {Number.isFinite(margin) ? margin.toFixed(0) : '0'}%
             </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B98166' }} />
                   <span style={{ color: '#6b7280', fontWeight: 500 }}>Lợi nhuận</span>
                </div>
                <span style={{ fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums', fontSize: '10px' }}>{formatShortVnd(sanitizeValue(profit))}</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                   <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e5e7eb' }} />
                   <span style={{ color: '#6b7280', fontWeight: 500 }}>Chi phí</span>
                </div>
                <span style={{ fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums', fontSize: '10px' }}>{formatShortVnd(sanitizeValue(cost))}</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricRow({ label, value, color, bold, isValueString }: { label: string; value: any; color?: string; bold?: boolean; isValueString?: boolean }) {
  const sanitizeValue = (val: any) => {
    if (val === null || val === undefined || val !== val) return '—';
    return val;
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
      <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
      <span style={{ 
        fontWeight: bold ? 700 : 600, 
        color: color || '#111827', 
        fontVariantNumeric: 'tabular-nums'
      }}>
        {isValueString ? value : formatVnd(sanitizeValue(value))}
      </span>
    </div>
  );
}
