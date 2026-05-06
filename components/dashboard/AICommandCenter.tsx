"use client";

import React from 'react';

const AIInsightCard = ({ title, content, type }: any) => (
  <div style={{ 
    padding: '16px', 
    background: 'var(--erp-card)', 
    borderLeft: `4px solid ${type === 'CRITICAL' ? 'var(--status-critical)' : type === 'WARNING' ? 'var(--status-warning)' : 'var(--brand-primary)'}`,
    borderRadius: '8px',
    marginBottom: '12px'
  }}>
    <div style={{ fontSize: '0.75rem', fontWeight: 700, opacity: 0.8, marginBottom: '4px' }}>{title}</div>
    <div style={{ fontSize: '0.875rem' }}>{content}</div>
  </div>
);

export const AICommandCenter = () => {
  return (
    <div className="ai-command-center" style={{ padding: 'var(--space-lg)', background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)', minHeight: '100vh' }}>
      <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, background: 'linear-gradient(to right, #60a5fa, #a78bfa)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AI Operations Command Center
          </h1>
          <p className="text-muted">Predictive Governance & Intelligence Layer | Enterprise v2.0</p>
        </div>
        <div className="kpi-card" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
           <div style={{ fontSize: '0.7rem', fontWeight: 700 }}>AI TRUST SCORE</div>
           <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>98.4%</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: 'var(--space-xl)' }}>
        
        {/* Left Column: Risk Radar & Threats */}
        <div>
          <h3>Enterprise Risk Radar</h3>
          <div style={{ marginTop: '24px' }}>
            <AIInsightCard 
                title="COST OVERRUN PREDICTION" 
                content="Dự án Metro Line 1 có xác suất vượt ngân sách 82% trong 60 ngày tới. Đề xuất cắt giảm chi phí gián tiếp."
                type="CRITICAL"
            />
            <AIInsightCard 
                title="VENDOR RISK" 
                content="Vendor X có pattern giao hàng chậm bất thường (↑ 15%). Có nguy cơ gây chậm tiến độ hầm B2."
                type="WARNING"
            />
            <AIInsightCard 
                title="GOVERNANCE THREAT" 
                content="Phát hiện phê duyệt PO giá trị lớn (>10 tỷ) bỏ qua bước thẩm định kỹ thuật tại Site C."
                type="CRITICAL"
            />
          </div>
        </div>

        {/* Center Column: Intelligence Visuals */}
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-lg)' }}>
             <div className="kpi-card" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <h3>Margin Erosion Heatmap</h3>
                <div style={{ height: '150px', display: 'flex', alignItems: 'flex-end', gap: '8px', marginTop: '16px' }}>
                   {[65, 42, 88, 30, 95, 55].map((h, i) => (
                     <div key={i} style={{ flex: 1, height: `${h}%`, background: h > 80 ? 'var(--status-critical)' : 'var(--brand-primary)', borderRadius: '4px 4px 0 0' }}></div>
                   ))}
                </div>
                <div className="text-muted" style={{ fontSize: '0.7rem', textAlign: 'center', marginTop: '8px' }}>Portfolio Projects (Variance Index)</div>
             </div>
             
             <div className="kpi-card" style={{ background: 'rgba(30, 41, 59, 0.5)' }}>
                <h3>Cashflow Stress Timeline</h3>
                <div style={{ marginTop: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem' }}>Next 30 Days</span>
                      <span style={{ fontWeight: 700, color: 'var(--status-healthy)' }}>STABLE</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.75rem' }}>30 - 60 Days</span>
                      <span style={{ fontWeight: 700, color: 'var(--status-warning)' }}>STRESS (↓ 1.2B)</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.75rem' }}>60 - 90 Days</span>
                      <span style={{ fontWeight: 700, color: 'var(--status-healthy)' }}>RECOVERY</span>
                   </div>
                </div>
             </div>
          </div>

          <div style={{ marginTop: '32px' }}>
            <h3>Executive AI Copilot Feed</h3>
            <div className="kpi-card" style={{ marginTop: '16px', background: 'rgba(255,255,255,0.03)', padding: '24px' }}>
               <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ width: '40px', height: '40px', background: 'var(--brand-secondary)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🤖</div>
                  <div>
                     <div style={{ fontWeight: 700, color: 'var(--brand-secondary)' }}>AI REASONING LOG</div>
                     <p style={{ marginTop: '8px', fontSize: '0.9rem', lineHeight: '1.6' }}>
                        "Sau khi phân tích Knowledge Graph, tôi phát hiện Project A đang bị 'Underbilling' khoảng 4.5 tỷ đồng so với tiến độ MB thực tế. Nguyên nhân là do quy trình phê duyệt hồ sơ thanh toán tại văn phòng chậm 12 ngày so với tiêu chuẩn. Đề xuất tăng ưu tiên cho PM Nguyen Van A."
                     </p>
                  </div>
               </div>
            </div>
          </div>
        </div>

        {/* Right Column: Attention Queue */}
        <div>
          <h3>Executive Attention Queue</h3>
          <div style={{ marginTop: '24px' }}>
             {[
               { p: 'Metro Line 1', issue: 'Contract Variation > 15%', urgency: 'CRITICAL' },
               { p: 'Vinhomes Park', issue: 'Overdue Vendor Payment (22 days)', urgency: 'HIGH' },
               { p: 'Tan Son Nhat T3', issue: 'Suspicious Inventory Issue', urgency: 'HIGH' },
               { p: 'All Projects', issue: 'Quarterly Margin Review Needed', urgency: 'MED' },
             ].map((q, i) => (
               <div key={i} className="kpi-card" style={{ marginBottom: '12px', border: q.urgency === 'CRITICAL' ? '1px solid var(--status-critical)' : '1px solid var(--erp-border)' }}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 900, color: q.urgency === 'CRITICAL' ? 'var(--status-critical)' : 'var(--brand-primary)' }}>{q.urgency}</div>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', marginTop: '4px' }}>{q.p}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>{q.issue}</div>
               </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};
