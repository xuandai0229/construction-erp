"use client";

import React from 'react';

export const ExecutiveApprovalHub = () => {
  return (
    <div className="executive-hub" style={{ padding: 'var(--space-lg)' }}>
      <header style={{ marginBottom: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 900 }}>Executive Approval Hub</h1>
          <p className="text-muted">Enterprise Delegation of Authority (DOA) Monitoring</p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
           <button className="btn btn-ghost">GOVERNANCE POLICIES</button>
           <button className="btn btn-primary">AUTHORITY MATRIX</button>
        </div>
      </header>

      {/* Global Approval Stats */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="text-muted">Total Pending Items</div>
          <div className="kpi-value">124</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-warning)' }}>Σ Value: 42.5 B</div>
        </div>
        <div className="kpi-card">
          <div className="text-muted">Avg. Latency (SLA)</div>
          <div className="kpi-value">18.4h</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--status-healthy)' }}>↓ 15% vs Last Week</div>
        </div>
        <div className="kpi-card">
          <div className="text-muted">Active Delegations</div>
          <div className="kpi-value">12</div>
          <div style={{ fontSize: '0.75rem' }}>3 Emergency Overrides</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-critical)' }}>
          <div className="text-muted">Bottleneck Rate</div>
          <div className="kpi-value" style={{ color: 'var(--status-critical)' }}>8.2%</div>
          <div style={{ fontSize: '0.75rem' }}>4 Stalled > 72h</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-xl)' }}>
        {/* Real-time Approval Flow & Bottlenecks */}
        <div>
          <h3>Approval Bottlenecks & SLA Monitoring</h3>
          <div className="erp-table-container" style={{ marginTop: 'var(--space-md)' }}>
             <table className="erp-table">
               <thead>
                 <tr>
                   <th>Executive / Approver</th>
                   <th>Pending</th>
                   <th>Avg Latency</th>
                   <th>Workload</th>
                   <th>Action</th>
                 </tr>
               </thead>
               <tbody>
                 {[
                   { name: 'Nguyen Van A (CFO)', pending: 14, latency: '42h', load: 85, status: 'Overloaded' },
                   { name: 'Tran Thi B (Director)', pending: 5, latency: '12h', load: 42, status: 'Normal' },
                   { name: 'Le Van C (PM)', pending: 22, latency: '18h', load: 92, status: 'High' },
                   { name: 'Emergency Queue', pending: 3, latency: '0.5h', load: 15, status: 'Healthy' },
                 ].map((a, i) => (
                   <tr key={i}>
                     <td><span style={{ fontWeight: 700 }}>{a.name}</span></td>
                     <td>{a.pending} items</td>
                     <td style={{ color: a.latency.includes('42') ? 'var(--status-critical)' : 'inherit' }}>{a.latency}</td>
                     <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                           <div style={{ flex: 1, height: '6px', background: '#334155', borderRadius: '3px', overflow: 'hidden' }}>
                              <div style={{ width: `${a.load}%`, height: '100%', background: a.load > 80 ? 'var(--status-critical)' : 'var(--brand-primary)' }}></div>
                           </div>
                           <span style={{ fontSize: '0.75rem' }}>{a.load}%</span>
                        </div>
                     </td>
                     <td><button style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'transparent', border: '1px solid var(--erp-border)', color: 'var(--erp-text)', cursor: 'pointer' }}>REMIND</button></td>
                   </tr>
                 ))}
               </tbody>
             </table>
          </div>
        </div>

        {/* Delegation & Anomaly Tracking */}
        <div>
          <h3>Delegation & Continuity</h3>
          <div className="kpi-card" style={{ marginTop: 'var(--space-md)' }}>
             {[
               { owner: 'Nguyen Van A', delegate: 'Tran Van D', end: '2026-05-10', reason: 'Vacation' },
               { owner: 'Le Van C', delegate: 'Hoang Thi E', end: '2026-05-08', reason: 'Site Visit' },
             ].map((d, i) => (
               <div key={i} style={{ marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--erp-border)' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>{d.owner} → {d.delegate}</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Mục đích: {d.reason} | Hết hạn: {d.end}</div>
               </div>
             ))}
             <button className="btn btn-ghost" style={{ width: '100%', justifyContent: 'center', fontSize: '0.8rem' }}>+ THÊM ỦY QUYỀN TẠM THỜI</button>
          </div>

          <h3 style={{ marginTop: '24px' }}>Governance Anomaly Detection</h3>
          <div className="kpi-card" style={{ marginTop: 'var(--space-md)', background: 'rgba(239, 68, 68, 0.05)', border: '1px solid var(--status-critical)' }}>
             <div style={{ color: 'var(--status-critical)', fontWeight: 700, fontSize: '0.875rem' }}>⚠️ 3 Tín hiệu nghi vấn (Anomalies)</div>
             <div style={{ marginTop: '12px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                   <strong>Shadow Workflow:</strong> Phát hiện thanh toán 1.2B không có PO gốc tại Project X.
                </div>
                <div style={{ padding: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                   <strong>Override Abuse:</strong> User "NV_C" sử dụng Emergency Approval 5 lần/tuần.
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
