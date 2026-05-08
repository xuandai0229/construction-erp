'use client';

import { DashboardData, formatVnd } from './dashboard-data';

export default function DebtPanel({ data }: { data: DashboardData }) {
  const arTotal = data.receivable.total;
  const arPaid  = data.receivable.paid;
  const arRem   = arTotal - arPaid;
  const apTotal = data.payable.total;
  const apPaid  = data.payable.paid;
  const apRem   = apTotal - apPaid;

  const sanitizeValue = (val: any) => {
    if (val === null || val === undefined || val !== val) return 0;
    return val;
  };

  return (
    <div className="erp-card flex flex-col h-full" style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)', borderRadius: '12px' }}>
      <div style={{ height: '40px', padding: '0 16px', borderBottom: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg, #f9fafb 0%, #f0f1f5 100%)' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Công nợ</h3>
      </div>
      <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', flex: 1 }}>
        {/* PHẢI THU */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', letterSpacing: '0.5px' }}>Phải thu</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <DebtRow label="Tổng phải thu" val={sanitizeValue(arTotal)} color="#2563eb" />
            <DebtRow label="Đã thu" val={sanitizeValue(arPaid)} color="#10B981" />
            <DebtRow label="Còn lại" val={sanitizeValue(arRem)} color="#9CA3AF" />
            <DebtRow label="Quá hạn" val={sanitizeValue(arRem * 0.4)} color="#EF4444" />
          </div>
        </div>

        {/* PHẢI TRẢ */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #e5e7eb', paddingBottom: '4px', letterSpacing: '0.5px' }}>Phải trả</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
            <DebtRow label="Tổng phải trả" val={sanitizeValue(apTotal)} color="#2563eb" />
            <DebtRow label="Đã trả" val={sanitizeValue(apPaid)} color="#10B981" />
            <DebtRow label="Còn lại" val={sanitizeValue(apRem)} color="#9CA3AF" />
            <DebtRow label="Quá hạn" val={sanitizeValue(apRem * 0.1)} color="#EF4444" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DebtRow({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
         <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}66` }} />
         <span style={{ color: '#6b7280', fontWeight: 500 }}>{label}</span>
       </div>
       <span style={{ fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums', fontSize: '10px' }}>{formatVnd(val)}</span>
    </div>
  );
}
