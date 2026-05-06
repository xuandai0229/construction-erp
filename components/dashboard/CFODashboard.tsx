"use client";

import React from 'react';

export const CFODashboard = () => {
  return (
    <div className="cfo-dashboard" style={{ padding: 'var(--space-lg)', background: '#f8fafc', color: '#1e293b', minHeight: '100vh' }}>
      <header style={{ borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: '#64748b', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.1em' }}>ENTERPRISE FINANCIAL OPERATING SYSTEM</div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 900, color: '#0f172a' }}>Group CFO Command Center</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>CONSOLIDATION STATE: <span style={{ color: '#10b981', fontWeight: 700 }}>BALANCED (Q2 2026)</span></div>
           <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0f172a' }}>Σ Cash: 124.5 tỷ VNĐ</div>
        </div>
      </header>

      {/* Financial Health KPIs */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Consolidated Revenue</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>842.0 B</div>
          <div style={{ color: '#10b981', fontSize: '0.75rem' }}>↑ 14% vs LY</div>
        </div>
        <div className="kpi-card" style={{ background: '#fff', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '0.75rem' }}>Liquidity Ratio</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>2.14</div>
          <div style={{ color: '#10b981', fontSize: '0.75rem' }}>Healthy</div>
        </div>
        <div style={{ padding: '1.5rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
          <div style={{ color: '#991b1b', fontSize: '0.75rem', fontWeight: 700 }}>Tax & Compliance Risk</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#991b1b' }}>MEDIUM</div>
          <div style={{ color: '#991b1b', fontSize: '0.75rem' }}>4 Unreconciled E-Invoices</div>
        </div>
        <div style={{ padding: '1.5rem', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: '8px' }}>
          <div style={{ color: '#9a3412', fontSize: '0.75rem', fontWeight: 700 }}>Internal Audit Flags</div>
          <div style={{ fontSize: '1.5rem', fontWeight: 900, color: '#9a3412' }}>3 Alerts</div>
          <div style={{ color: '#9a3412', fontSize: '0.75rem' }}>1 Critical SOD Violation</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-xl)', marginTop: '32px' }}>
        
        {/* Project Profitability & Cost Control */}
        <div>
          <h3>Group Project Financial Performance</h3>
          <div className="erp-table-container" style={{ marginTop: '16px', background: '#fff' }}>
            <table className="erp-table" style={{ color: '#1e293b' }}>
               <thead>
                  <tr style={{ background: '#f1f5f9' }}>
                     <th>Project Entity</th>
                     <th>Revenue</th>
                     <th>Actual Cost</th>
                     <th>Comm. Cost</th>
                     <th>Margin</th>
                     <th>Status</th>
                  </tr>
               </thead>
               <tbody>
                  {[
                    { name: 'Subsidiary A: Landmark', rev: '142B', cost: '124B', comm: '12B', margin: '12.6%', status: 'Stable' },
                    { name: 'Subsidiary B: Metro', rev: '85B', cost: '82B', comm: '8B', margin: '3.5%', status: 'At Risk' },
                    { name: 'JV: Grand Park', rev: '210B', cost: '184B', comm: '15B', margin: '12.4%', status: 'Healthy' },
                  ].map((p, i) => (
                    <tr key={i}>
                       <td style={{ fontWeight: 700 }}>{p.name}</td>
                       <td>{p.rev}</td>
                       <td>{p.cost}</td>
                       <td>{p.comm}</td>
                       <td style={{ color: p.margin.includes('3.5') ? '#ef4444' : 'inherit', fontWeight: 700 }}>{p.margin}</td>
                       <td><span className="badge" style={{ background: p.status === 'At Risk' ? '#fee2e2' : '#f1f5f9', color: p.status === 'At Risk' ? '#ef4444' : '#1e293b' }}>{p.status}</span></td>
                    </tr>
                  ))}
               </tbody>
            </table>
          </div>
          
          <div style={{ marginTop: '24px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
             <div className="kpi-card" style={{ background: '#fff' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem' }}>Variation Orders (VO) Hub</h4>
                <div style={{ marginTop: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                      <span>Pending VOs</span>
                      <span style={{ fontWeight: 700 }}>12 Items</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span>Σ Potential Claims</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>4.2 tỷ VNĐ</span>
                   </div>
                </div>
             </div>
             <div className="kpi-card" style={{ background: '#fff' }}>
                <h4 style={{ margin: 0, fontSize: '0.875rem' }}>Guarantee Management</h4>
                <div style={{ marginTop: '16px' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem', marginBottom: '8px' }}>
                      <span>Expiring in 30 Days</span>
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>3 Guarantees</span>
                   </div>
                   <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                      <span>Total Bond Value</span>
                      <span style={{ fontWeight: 700 }}>185 tỷ VNĐ</span>
                   </div>
                </div>
             </div>
          </div>
        </div>

        {/* Treasury & Compliance Sidebar */}
        <div>
          <h3>Treasury & Liquidity</h3>
          <div className="kpi-card" style={{ background: '#fff', marginTop: '16px' }}>
             <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 700 }}>CASH POSITION BY BANK</div>
             <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[
                  { bank: 'Vietcombank', balance: '45.2 B', type: 'Operating' },
                  { bank: 'Techcombank', balance: '28.0 B', type: 'Payroll' },
                  { bank: 'BIDV', balance: '12.3 B', type: 'Guarantee' },
                ].map((b, i) => (
                  <div key={i} style={{ display: 'flex', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: '1px solid #f1f5f9' }}>
                     <div>
                        <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>{b.bank}</div>
                        <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>{b.type}</div>
                     </div>
                     <div style={{ fontWeight: 700 }}>{b.balance}</div>
                  </div>
                ))}
             </div>
          </div>

          <h3 style={{ marginTop: '32px' }}>Vietnam Compliance Radar</h3>
          <div className="kpi-card" style={{ background: '#fff', marginTop: '16px' }}>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '10px', height: '100%', background: '#ef4444', borderRadius: '5px' }}></div>
                <div>
                   <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>E-Invoice Reconciliation</div>
                   <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>VNPT-Invoice Sync Error at Project Metro</div>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ width: '10px', height: '100%', background: '#10b981', borderRadius: '5px' }}></div>
                <div>
                   <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>VAT Filling Readiness</div>
                   <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>Period: Q2 2026 | All Entities Matched</div>
                </div>
             </div>
             <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '10px', height: '100%', background: '#f59e0b', borderRadius: '5px' }}></div>
                <div>
                   <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>A-B Payment Records</div>
                   <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>2 Pending Certification at Landmark B</div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
