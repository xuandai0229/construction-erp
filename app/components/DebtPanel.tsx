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
    <div className="erp-card flex flex-col h-full" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
      <div style={{ height: '44px', padding: '0 var(--sp-12)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center' }}>
        <h3 style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>CÔNG NỢ</h3>
      </div>
      <div style={{ padding: 'var(--sp-12)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--sp-16)', flex: 1 }}>
        {/* PHẢI THU */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid var(--bg-muted)', paddingBottom: '4px' }}>PHẢI THU (KHÁCH HÀNG)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <DebtRow label="Tổng phải thu" val={arTotal} color="var(--brand)" />
            <DebtRow label="Đã thu" val={arPaid} color="var(--success)" />
            <DebtRow label="Còn lại" val={arRem} color="var(--text-muted)" />
            <DebtRow label="Quá hạn" val={arRem * 0.4} color="var(--danger)" />
          </div>
        </div>

        {/* PHẢI TRẢ */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '8px', borderBottom: '1px solid var(--bg-muted)', paddingBottom: '4px' }}>PHẢI TRẢ (NHÀ CUNG CẤP)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <DebtRow label="Tổng phải trả" val={apTotal} color="var(--brand)" />
            <DebtRow label="Đã trả" val={apPaid} color="var(--success)" />
            <DebtRow label="Còn lại" val={apRem} color="var(--text-muted)" />
            <DebtRow label="Quá hạn" val={apRem * 0.1} color="var(--danger)" />
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
         <span style={{ color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
       </div>
       <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{formatVnd(val)}</span>
    </div>
  );
}
