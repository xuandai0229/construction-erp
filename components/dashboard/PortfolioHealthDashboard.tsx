"use client";

import React from 'react';

export const PortfolioHealthDashboard = () => {
  return (
    <div className="portfolio-dashboard" style={{ padding: 'var(--space-lg)' }}>
      <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900 }}>Enterprise Portfolio Governance</h1>
          <p className="text-muted">Real-time oversight of 42 Active Projects | 8 Region Centers</p>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--status-healthy)' }}>● ENTERPRISE CORE: ONLINE</div>
           <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>94.2% Compliance</div>
        </div>
      </header>

      {/* Portfolio Overview Stats */}
      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card" style={{ borderTop: '4px solid var(--brand-primary)' }}>
          <div className="text-muted">Total Portfolio Value</div>
          <div className="kpi-value">1,240.5 B</div>
          <div style={{ color: 'var(--status-healthy)', fontSize: '0.75rem' }}>↑ 12% vs Last Quarter</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '4px solid var(--status-warning)' }}>
          <div className="text-muted">Avg. Margin Erosion</div>
          <div className="kpi-value" style={{ color: 'var(--status-warning)' }}>-2.4%</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>Next Forecast: -2.1%</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '4px solid var(--status-healthy)' }}>
          <div className="text-muted">Operational Maturity</div>
          <div className="kpi-value">4.2 / 5.0</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>92% Adoption Rate</div>
        </div>
        <div className="kpi-card" style={{ borderTop: '4px solid var(--status-critical)' }}>
          <div className="text-muted">Governance Red-Flags</div>
          <div className="kpi-value" style={{ color: 'var(--status-critical)' }}>7</div>
          <div className="text-muted" style={{ fontSize: '0.75rem' }}>3 High-Risk Overruns</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)' }}>
        {/* Project Heatmap & Risk */}
        <div>
          <h3>Cross-Project Risk Heatmap</h3>
          <div className="erp-table-container" style={{ marginTop: 'var(--space-md)' }}>
             <table className="erp-table">
               <thead>
                 <tr>
                   <th>Project Name</th>
                   <th>Budget Health</th>
                   <th>WBS Drift</th>
                   <th>Compliance</th>
                   <th>Status</th>
                 </tr>
               </thead>
               <tbody>
                 {[
                   { name: 'Landmark 81 - Phase B', budget: 'Healthy', drift: 'Low', score: 98, status: 'Active' },
                   { name: 'Metro Line 1 Depot', budget: 'Critical', drift: 'High', score: 65, status: 'At Risk' },
                   { name: 'Vinhomes Grand Park', budget: 'Warning', drift: 'Med', score: 82, status: 'Active' },
                   { name: 'Tan Son Nhat T3', budget: 'Healthy', drift: 'Low', score: 95, status: 'Bootstrap' },
                 ].map((p, i) => (
                   <tr key={i}>
                     <td><span style={{ fontWeight: 700 }}>{p.name}</span></td>
                     <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: p.budget === 'Healthy' ? 'var(--status-healthy)' : p.budget === 'Warning' ? 'var(--status-warning)' : 'var(--status-critical)' }}></div>
                           {p.budget}
                        </div>
                     </td>
                     <td>{p.drift}</td>
                     <td>
                        <div className="indicator">
                           <div className="indicator-fill" style={{ width: `${p.score}%`, background: p.score > 90 ? 'var(--status-healthy)' : p.score > 80 ? 'var(--status-warning)' : 'var(--status-critical)' }}></div>
                        </div>
                     </td>
                     <td><span className="badge">{p.status}</span></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Master Data Integrity & Adoption */}
        <div>
          <h3>Enterprise Data Integrity</h3>
          <div className="kpi-card" style={{ marginTop: 'var(--space-md)' }}>
             <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span>Vendor Normalization</span>
                   <span style={{ fontWeight: 700 }}>98.2%</span>
                </div>
                <div className="indicator"><div className="indicator-fill" style={{ width: '98%', background: 'var(--brand-primary)' }}></div></div>
             </div>
             <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span>Material Catalog Adherence</span>
                   <span style={{ fontWeight: 700 }}>85.5%</span>
                </div>
                <div className="indicator"><div className="indicator-fill" style={{ width: '85%', background: 'var(--brand-secondary)' }}></div></div>
             </div>
             <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span>WBS Template Consistency</span>
                   <span style={{ fontWeight: 700 }}>92.0%</span>
                </div>
                <div className="indicator"><div className="indicator-fill" style={{ width: '92%', background: 'var(--status-healthy)' }}></div></div>
             </div>
          </div>

          <h3 style={{ marginTop: '24px' }}>Organizational Adoption</h3>
          <div className="kpi-card" style={{ marginTop: 'var(--space-md)', background: 'var(--erp-bg)' }}>
             <div style={{ fontSize: '0.75rem', color: 'var(--erp-text-muted)' }}>TOP PERFORMING PMs</div>
             <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span>1. Nguyen Van A</span>
                   <span style={{ color: 'var(--status-healthy)' }}>98.5 Score</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                   <span>2. Tran Thi B</span>
                   <span style={{ color: 'var(--status-healthy)' }}>96.2 Score</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
