"use client";

import React from 'react';

export const AutonomousOperationsCenter = () => {
  return (
    <div className="autonomous-center" style={{ padding: 'var(--space-lg)', background: '#020617', minHeight: '100vh', color: '#f8fafc' }}>
      <header style={{ borderBottom: '1px solid #1e293b', paddingBottom: '24px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <div style={{ color: 'var(--brand-secondary)', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.1em' }}>AUTONOMOUS INTELLIGENCE PLATFORM</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px' }}>Enterprise AI Operations Cockpit</h1>
        </div>
        <div style={{ textAlign: 'right' }}>
           <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>LEARNING STATE: ACTIVE</div>
           <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-healthy)' }}>92.4% Prediction Accuracy</div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 'var(--space-xl)' }}>
        
        {/* Simulation Workspace */}
        <div className="kpi-card" style={{ background: '#0f172a', border: '1px solid #334155' }}>
          <h3>What-if Simulation Workspace</h3>
          <div style={{ marginTop: '24px' }}>
             <label style={{ fontSize: '0.75rem', display: 'block', marginBottom: '8px' }}>SCENARIO VARIABLE</label>
             <select style={{ width: '100%', padding: '12px', background: '#1e293b', border: 'none', color: 'white', borderRadius: '4px' }}>
                <option>Steel Price (+15%)</option>
                <option>Cement Price (+8%)</option>
                <option>Labor Shortage (+10 days)</option>
             </select>
             <button className="btn btn-primary" style={{ width: '100%', marginTop: '16px', borderRadius: '4px' }}>RUN SIMULATION</button>
             
             <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(255,255,255,0.03)', borderRadius: '8px' }}>
                <div style={{ color: 'var(--status-warning)', fontSize: '0.75rem', fontWeight: 700 }}>PROJECTED IMPACT</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 900, marginTop: '4px' }}>-2.4% Margin</div>
                <p style={{ fontSize: '0.75rem', marginTop: '8px', opacity: 0.8 }}>Rủi ro dòng tiền tại dự án Metro B vào tháng 10.</p>
             </div>
          </div>
        </div>

        {/* Digital Twin Viewer */}
        <div className="kpi-card" style={{ background: '#0f172a', border: '1px solid #334155' }}>
          <h3>Portfolio Digital Twin</h3>
          <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
             {[
               { name: 'Landmark Tower', financial: 94, ops: 82 },
               { name: 'Metro Line 1', financial: 65, ops: 45 },
               { name: 'Grand Park', financial: 98, ops: 95 },
             ].map((p, i) => (
               <div key={i} style={{ padding: '12px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                     <span style={{ fontSize: '0.875rem', fontWeight: 700 }}>{p.name}</span>
                     <span style={{ fontSize: '0.75rem', color: p.financial < 70 ? 'var(--status-critical)' : 'var(--status-healthy)' }}>● SYNCED</span>
                  </div>
                  <div style={{ height: '4px', background: '#334155', borderRadius: '2px', overflow: 'hidden' }}>
                     <div style={{ width: `${p.financial}%`, height: '100%', background: p.financial < 70 ? 'var(--status-critical)' : 'var(--brand-primary)' }}></div>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Multi-Agent Intelligence Feed */}
        <div className="kpi-card" style={{ background: '#0f172a', border: '1px solid #334155' }}>
          <h3>Cross-Agent Intelligence</h3>
          <div style={{ marginTop: '16px', fontSize: '0.875rem' }}>
             <div style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '3px solid var(--brand-secondary)' }}>
                <span style={{ color: 'var(--brand-secondary)', fontWeight: 900, fontSize: '0.7rem' }}>[FINANCE AGENT]</span>
                <p style={{ marginTop: '4px' }}>Dấu hiệu bất thường tại Vendor X (Giá tăng 12% so với benchmark).</p>
             </div>
             <div style={{ marginBottom: '16px', paddingLeft: '12px', borderLeft: '3px solid var(--status-warning)' }}>
                <span style={{ color: 'var(--status-warning)', fontWeight: 900, fontSize: '0.7rem' }}>[SITE AGENT]</span>
                <p style={{ marginTop: '4px' }}>Cảnh báo tiến độ tại Block C: Năng suất nhân công giảm 8%.</p>
             </div>
             <div style={{ paddingLeft: '12px', borderLeft: '3px solid #60a5fa' }}>
                <span style={{ color: '#60a5fa', fontWeight: 900, fontSize: '0.7rem' }}>[STRATEGY AGENT]</span>
                <p style={{ marginTop: '4px' }}>Đề xuất điều chuyển PM Van A từ Tower A sang Metro B.</p>
             </div>
          </div>
        </div>
      </div>

      {/* Autonomous Optimization Suggestions */}
      <div style={{ marginTop: '32px' }}>
         <h3 style={{ marginBottom: '16px' }}>Autonomous Optimization Engine</h3>
         <div className="erp-table-container">
            <table className="erp-table">
               <thead>
                  <tr>
                     <th>Optimization Target</th>
                     <th>Recommendation</th>
                     <th>AI Reasoning</th>
                     <th>Est. ROI Impact</th>
                     <th>Action</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td>Resource Allocation</td>
                     <td>Move 2 Units of Excavators to Project B</td>
                     <td>Project B has 15% delay risk due to machine failure.</td>
                     <td style={{ color: 'var(--status-healthy)' }}>+ 1.2 Billion</td>
                     <td><button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>EXECUTE</button></td>
                  </tr>
                  <tr>
                     <td>Procurement Timing</td>
                     <td>Bulk Purchase: Structural Steel (500 Tons)</td>
                     <td>Vector Memory: Price hike pattern detected for Q4.</td>
                     <td style={{ color: 'var(--status-healthy)' }}>+ 0.8 Billion</td>
                     <td><button className="btn btn-primary" style={{ fontSize: '0.7rem', padding: '4px 8px' }}>EXECUTE</button></td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
