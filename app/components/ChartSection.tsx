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
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr 1fr', gap: '16px', marginTop: '16px' }}>
      {/* ── PANEL 1: BUDGET ALLOCATION ── */}
      <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', height: '300px', background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)', borderRadius: '12px' }}>
        <div style={{ height: '40px', padding: '0 16px', borderBottom: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg, #f9fafb 0%, #f0f1f5 100%)' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Phân bổ ngân sách</h3>
        </div>
        <div style={{ padding: '18px', flex: 1, display: 'flex', alignItems: 'center', gap: '18px' }}>
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
                <div style={{ fontSize: '20px', fontWeight: 800, color: '#111827', lineHeight: 1.2 }}>45.0B</div>
                <div style={{ fontSize: '9px', color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.5px' }}>Tổng</div>
             </div>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {costByType.map(c => (
              <div key={c.type} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: c.color, boxShadow: `0 0 8px ${c.color}66` }} />
                  <span style={{ fontWeight: 500, color: '#6b7280' }}>{c.label}</span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <span style={{ fontWeight: 700, color: '#111827', width: '24px', textAlign: 'right' }}>{c.pct}</span>
                  <span style={{ fontWeight: 600, color: '#9CA3AF', textAlign: 'right', minWidth: '50px' }}>{formatShortVnd(c.value)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── PANEL 2: CASHFLOW ── */}
      <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', height: '300px', background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)', borderRadius: '12px' }}>
        <div style={{ height: '40px', padding: '0 16px', borderBottom: '2px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'linear-gradient(180deg, #f9fafb 0%, #f0f1f5 100%)' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Dòng tiền (Tỉ VND)</h3>
          <div style={{ display: 'flex', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: '#6b7280' }}>
              <div style={{ width: '8px', height: '3px', borderRadius: '2px', background: '#10B981' }} /> Thu
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10px', fontWeight: 700, color: '#6b7280' }}>
              <div style={{ width: '8px', height: '3px', borderRadius: '2px', background: '#EF4444' }} /> Chi
            </div>
          </div>
        </div>
        <div style={{ padding: '18px 14px 16px 14px', flex: 1, display: 'flex', flexDirection: 'column' }}>
           <div style={{ flex: 1, position: 'relative', borderLeft: '1px solid #e5e7eb', borderBottom: '1px solid #e5e7eb', marginLeft: '36px', marginBottom: '20px' }}>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', pointerEvents: 'none' }}>
                 {[1,2,3,4].map(i => <div key={i} style={{ width: '100%', borderTop: '1px solid #f3f4f6' }} />)}
              </div>
              
              <div style={{ position: 'absolute', left: '-40px', inset: '0', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', fontSize: '9px', fontWeight: 700, color: '#9CA3AF', textAlign: 'right', paddingRight: '6px' }}>
                <span>40B</span><span>30B</span><span>20B</span><span>10B</span><span>0</span>
              </div>

              <div style={{ position: 'absolute', bottom: '-20px', left: 0, right: 0, display: 'flex', justifyContent: 'space-between', fontSize: '8px', fontWeight: 700, color: '#9ca3af' }}>
                {trends.map(t => <span key={t.month}>{t.month}</span>)}
              </div>

              <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: 'absolute', inset: 0, height: '100%', width: '100%', overflow: 'visible' }}>
                <path d={`M ${revenuePath}`} fill="none" stroke="#10B981" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
                <path d={`M ${costPath}`} fill="none" stroke="#EF4444" strokeWidth="2.5" vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
           </div>
        </div>
      </div>

      {/* ── PANEL 3: PROGRESS ── */}
      <div className="erp-card" style={{ display: 'flex', flexDirection: 'column', height: '300px', background: 'linear-gradient(135deg, #ffffff 0%, #fafbfc 100%)', border: '1px solid #e5e7eb', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.06)', borderRadius: '12px' }}>
        <div style={{ height: '40px', padding: '0 16px', borderBottom: '2px solid #f0f0f0', display: 'flex', alignItems: 'center', background: 'linear-gradient(180deg, #f9fafb 0%, #f0f1f5 100%)' }}>
          <h3 style={{ fontSize: '11px', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Tiến độ tổng thể</h3>
        </div>
        <div style={{ padding: '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div style={{ height: '110px', width: '180px', position: 'relative', marginTop: '8px' }}>
             <svg viewBox="0 0 200 120" style={{ width: '100%', height: '100%' }}>
               <path d="M 20,110 A 80,80 0 0,1 180,110" fill="none" stroke="#E5E7EB" strokeWidth="18" strokeLinecap="round" />
               <path d="M 20,110 A 80,80 0 0,1 180,110" fill="none" stroke="#10B981" strokeWidth="18" strokeLinecap="round" strokeDasharray={`${(Math.PI * 80) * (Math.min(data.progress, 100) / 100)} 300`} />
             </svg>
             <div style={{ position: 'absolute', bottom: '-4px', left: 0, right: 0, textAlign: 'center' }}>
                <div style={{ fontSize: '36px', fontWeight: 900, color: '#111827', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{Number.isFinite(data.progress) ? data.progress : 0}%</div>
             </div>
          </div>
          
          <div style={{ width: '100%', marginTop: '18px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#6b7280' }}>Bắt đầu:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>01/01/2024</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#6b7280' }}>Kết thúc:</span>
                <span style={{ fontWeight: 700, color: '#111827' }}>31/12/2025</span>
             </div>
             <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px' }}>
                <span style={{ color: '#6b7280' }}>Tiến độ:</span>
                <span style={{ fontWeight: 700, color: '#10B981' }}>{data.daysRemaining} / 730</span>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
