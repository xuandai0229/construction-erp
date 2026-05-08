'use client';

import { DashboardData, formatVnd } from './dashboard-data';

export default function DebtPanel({ data }: { data: DashboardData }) {
  const arTotal = data.receivable.total;
  const arPaid  = data.receivable.paid;
  const arRem   = arTotal - arPaid;
  const apTotal = data.payable.total;
  const apPaid  = data.payable.paid;
  const apRem   = apTotal - apPaid;

  return (
    <div className="erp-card flex flex-col h-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: '12px' }}>
      <div style={{ height: '44px', padding: '0 var(--sp-16)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: '#F8FAFC' }}>
        <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CÔNG NỢ</h3>
      </div>
      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', flex: 1 }}>
        {/* PHẢI THU */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '4px' }}>PHẢI THU (KHÁCH HÀNG)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <DebtRow label="Tổng phải thu" val={arTotal} color="#2563eb" />
            <DebtRow label="Đã thu" val={arPaid} color="#10B981" />
            <DebtRow label="Còn lại" val={arRem} color="#9CA3AF" />
            <DebtRow label="Quá hạn" val={arRem * 0.4} color="#EF4444" />
          </div>
        </div>

        {/* PHẢI TRẢ */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid #E5E7EB', paddingBottom: '4px' }}>PHẢI TRẢ (NHÀ CUNG CẤP)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <DebtRow label="Tổng phải trả" val={apTotal} color="#2563eb" />
            <DebtRow label="Đã trả" val={apPaid} color="#10B981" />
            <DebtRow label="Còn lại" val={apRem} color="#9CA3AF" />
            <DebtRow label="Quá hạn" val={apRem * 0.1} color="#EF4444" />
          </div>
        </div>
      </div>
    </div>
  );
}

function DebtRow({ label, val, color }: { label: string; val: number; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '10px' }}>
       <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
         <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: color }} />
         <span style={{ color: '#64748b', fontWeight: 500 }}>{label}</span>
       </div>
       <span style={{ fontWeight: 700, color: '#111827', fontVariantNumeric: 'tabular-nums' }}>{formatVnd(val)}</span>
    </div>
  );
}
