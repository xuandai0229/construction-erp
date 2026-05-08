'use client';

import React from 'react';
import { DashboardData, formatShortVnd } from './dashboard-data';

export default function ChartSection({ data }: { data: DashboardData }) {
  const trends = data.monthlyTrends || [];
  const maxVal = Math.max(...trends.map(t => Math.max(t.revenue, t.cost)), 1000000);
  
  const getX = (i: number) => (i / (Math.max(trends.length - 1, 1))) * 100;
  const getY = (v: number) => 100 - (v / maxVal) * 100;
  
  const revenuePath = trends.map((t, i) => `${getX(i)},${getY(t.revenue)}`).join(' L');
  const costPath = trends.map((t, i) => `${getX(i)},${getY(t.cost)}`).join(' L');

  const totalCost = data.totalActual;
  const CIRC = 2 * Math.PI * 74;
  let currentOffset = 0;

  const costByType = [
    { type: 'material', label: 'Vật liệu', value: totalCost * 0.4, color: '#2563EB', pct: '40%' },
    { type: 'labor',    label: 'Nhân công', value: totalCost * 0.2, color: '#10B981', pct: '20%' },
    { type: 'machine',  label: 'Máy móc',   value: totalCost * 0.15, color: '#F59E0B', pct: '15%' },
    { type: 'sub',      label: 'Thầu phụ',   value: totalCost * 0.15, color: '#9333EA', pct: '15%' },
    { type: 'general',  label: 'Chi phí chung', value: totalCost * 0.1, color: '#EC4899', pct: '10%' },
  ];

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: 'var(--sp-24)' }}>
      {/* ── PANEL 1: BUDGET ALLOCATION ── */}
      <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', height: '280px', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: '12px' }}>
        <div style={{ height: '44px', padding: '0 var(--sp-16)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phân bổ ngân sách</h3>
        </div>
        <div style={{ padding: '20px', flex: 1, display: 'flex', alignItems: 'center', gap: '24px' }}>
          <div style={{ height: '140px', width: '140px', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
             <svg viewBox="0 0 172 172" style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', transform: 'rotate(-90deg)' }}>
               <circle cx="86" cy="86" r="74" fill="transparent" stroke="#E5E7EB" strokeWidth="16" />
               {costByType.map((c) => {
                 const pctNum = parseFloat(c.pct);
                 const dash = (CIRC * pctNum) / 100;
                 const offset = currentOffset;
                 currentOffset -= dash;
                 return (
                   <circle 
                    key={c.type} cx="86" cy="86" r="74" fill="transparent" 
                    stroke={c.color} strokeWidth="16" 
                    strokeDasharray={`${dash} ${CIRC}`} 
                    strokeDashoffset={offset} 
                   />
                 );
               })}
             </svg>
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>45,000</div>
                <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700 }}>Triệu VND</div>
             </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {costByType.map(c => (
              <div key={c.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color }} />
                  <span style={{ fontWeight: 500, color: '#64748b' }}>{c.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <span style={{ fontWeight: 700, color: '#111827', width: '28px', textAlign: 'right' }}>{c.pct}</span>
                  <span style={{ fontWeight: 600, color: '#9CA3AF', textAlign: 'right', minWidth: '60px' }}>{formatShortVnd(c.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANEL 2: CASHFLOW ── */}
      <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', height: '280px', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: '12px' }}>
        <div style={{ height: '44px', padding: '0 var(--sp-16)', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dòng tiền (Triệu VND)</h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#10B981' }} /> Thu
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}>
              <div style={{ width: '8px', height: '8px', borderRadius: '2px', background: '#EF4444' }} /> Chi
            </div>
          </div>
        </div>
        <div style={{ padding: '24px 16px 16px 16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
           <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginLeft: '32px', marginBottom: '24px' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                 {[1,2,3,4].map(i => <div key={i} style={{ width: '100%', borderTop: '1px solid #F3F4F6' }} />)}
              </div>
              
              <div style={{ position: 'absolute', left: '-36px', inset: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: '#9CA3AF', textAlign: 'right', paddingRight: '8px' }}>
                <span>40B</span><span>30B</span><span>20B</span><span>10B</span><span>0</span>
              </div>

              <div style={{ position: 'absolute', bottom: '-24px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: 'var(--text-muted)' }}>
                {trends.map(t => <span key={t.month}>{t.month}</span>)}
              </div>

              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', overflow: 'visible' }}>
                <path d={`M ${revenuePath}`} fill="none" stroke="#10B981" strokeWidth="2" vectorEffect="non-scaling-stroke" />
                <path d={`M ${costPath}`} fill="none" stroke="#EF4444" strokeWidth="2" vectorEffect="non-scaling-stroke" />
              </svg>
           </div>
        </div>
      </div>

      {/* ── PANEL 3: PROGRESS ── */}
      <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', height: '280px', background: 'var(--bg-surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)', borderRadius: '12px' }}>
        <div style={{ height: '44px', padding: '0 var(--sp-16)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', background: '#F8FAFC' }}>
          <h3 style={{ fontSize: '12px', fontWeight: 700, color: '#111827', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tiến độ tổng thể</h3>
        </div>
        <div style={{ padding: '24px 16px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '110px', width: '180px', position: 'relative', marginTop: '5px' }}>
             <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
               <path d="M 20,110 A 80,80 0 0,1 180,110" fill="none" stroke="#E5E7EB" strokeWidth="20" strokeLinecap="round" />
               <path d="M 20,110 A 80,80 0 0,1 180,110" fill="none" stroke="#10B981" strokeWidth="20" strokeLinecap="round" strokeDasharray={`${(Math.PI * 80) * (Math.min(data.progress, 100) / 100)} 300`} />
             </svg>
             <div style={{ position: 'absolute', bottom: '0', left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '32px', fontWeight: 900, color: '#111827', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{Number.isFinite(data.progress) ? data.progress : 0}%</div>
             </div>
          </div>
          
          <div style={{ width: '100%', marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#64748b' }}>Ngày bắt đầu:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>01/01/2024</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#64748b' }}>Ngày kết thúc dự kiến:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>31/12/2025</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#64748b' }}>Số ngày đã qua:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>{data.daysRemaining} / 730 ngày</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
