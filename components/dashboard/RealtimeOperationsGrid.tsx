"use client";

import React from 'react';

export const RealtimeOperationsGrid = () => {
  return (
    <div className="realtime-grid" style={{ padding: 'var(--space-lg)', background: '#0a0a0a', minHeight: '100vh', color: '#e2e8f0' }}>
      <header style={{ borderBottom: '2px solid #1e293b', paddingBottom: '20px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ color: '#ef4444', fontSize: '0.75rem', fontWeight: 900, letterSpacing: '0.2em' }}>● LIVE MISSION CONTROL</div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginTop: '8px', color: '#fff' }}>Realtime Construction Network</h1>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>NETWORK LATENCY</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#10b981' }}>24ms</div>
           </div>
           <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', opacity: 0.6 }}>IOT DEVICES</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>1,248 Active</div>
           </div>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr', gap: 'var(--space-xl)' }}>
        
        {/* BIM Operations & 3D Site State */}
        <div className="kpi-card" style={{ background: '#111827', border: '1px solid #1f2937', height: '500px', position: 'relative' }}>
           <div style={{ position: 'absolute', top: '16px', left: '16px', zIndex: 10 }}>
              <h3 style={{ margin: 0 }}>BIM-Linked Operations</h3>
              <span style={{ fontSize: '0.75rem', color: '#3b82f6' }}>Model: Landmark_v4.ifc</span>
           </div>
           <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(circle, #1e293b 0%, #0f172a 100%)', borderRadius: '8px' }}>
              <div style={{ textAlign: 'center', opacity: 0.5 }}>
                 <div style={{ fontSize: '3rem' }}>🏗️</div>
                 <p>3D LIVE VIEW INITIALIZING...</p>
                 <div style={{ fontSize: '0.75rem' }}>Synchronizing WBS Elements: 4,200/4,200</div>
              </div>
           </div>
           {/* Quantity Mismatch Alerts */}
           <div style={{ position: 'absolute', bottom: '16px', left: '16px', right: '16px', padding: '12px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #ef4444', borderRadius: '4px' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ef4444' }}>⚠️ QUANTITY VARIANCE DETECTED</div>
              <div style={{ fontSize: '0.875rem' }}>WBS-102 (Concrete): BIM 420m3 vs ERP 450m3 (+30m3 discrepancy)</div>
           </div>
        </div>

        {/* AI Camera & Vision Intelligence */}
        <div>
           <h3>Camera AI Intelligence</h3>
           <div style={{ marginTop: '24px' }}>
              <div className="kpi-card" style={{ padding: 0, overflow: 'hidden', background: '#000', marginBottom: '16px' }}>
                 <div style={{ height: '180px', background: '#111', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                    <span style={{ fontSize: '0.7rem', position: 'absolute', top: '8px', left: '8px', background: 'rgba(239, 68, 68, 0.8)', padding: '2px 6px', borderRadius: '2px' }}>CAM-04 (Site North)</span>
                    <div style={{ border: '2px solid #ef4444', width: '40px', height: '60px', position: 'absolute', top: '50px', left: '100px' }}></div>
                    <span style={{ fontSize: '0.6rem', color: '#ef4444', position: 'absolute', top: '115px', left: '100px', fontWeight: 900 }}>MISSING HELMET</span>
                    <div style={{ opacity: 0.3 }}>[LIVE VIDEO FEED]</div>
                 </div>
                 <div style={{ padding: '12px' }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700 }}>SAFETY INCIDENT DETECTED</div>
                    <p style={{ fontSize: '0.7rem', opacity: 0.7, margin: '4px 0' }}>User ID: VN-1284 | Zone: North Tower | Level 4</p>
                    <button className="btn btn-primary" style={{ fontSize: '0.65rem', padding: '4px 8px', width: '100%' }}>AUTO-ESCALATE TO SITE MANAGER</button>
                 </div>
              </div>

              <div className="kpi-card" style={{ background: '#111827' }}>
                 <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6' }}>AI PROGRESS RECOGNITION</div>
                 <div style={{ marginTop: '12px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                       <span>Slab Pouring (T4)</span>
                       <span style={{ fontWeight: 700 }}>92%</span>
                    </div>
                    <div style={{ height: '4px', background: '#334155', borderRadius: '2px', marginTop: '4px', overflow: 'hidden' }}>
                       <div style={{ width: '92%', height: '100%', background: '#10b981' }}></div>
                    </div>
                    <p style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '8px' }}>Verified via Drone Feed: 2026-05-06 11:45</p>
                 </div>
              </div>
           </div>
        </div>

        {/* IoT & Site Awareness Radar */}
        <div>
           <h3>Site Awareness Radar</h3>
           <div className="kpi-card" style={{ background: '#111827', marginTop: '24px' }}>
              <div style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 900 }}>ACTIVE TELEMETRY</div>
              <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                 {[
                   { item: 'Crane-01', state: 'Lifting', load: '12.4T', status: 'HEALTHY' },
                   { item: 'Excavator-05', state: 'Idle', load: 'N/A', status: 'WARNING (FUEL)' },
                   { item: 'Batch Plant', state: 'Active', load: '45m3/h', status: 'HEALTHY' },
                 ].map((t, i) => (
                   <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px', background: 'rgba(255,255,255,0.03)', borderRadius: '4px' }}>
                      <div style={{ fontSize: '0.75rem' }}>
                         <div style={{ fontWeight: 700 }}>{t.item}</div>
                         <div style={{ opacity: 0.6 }}>{t.state} | {t.load}</div>
                      </div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 900, color: t.status.includes('HEALTHY') ? '#10b981' : '#f59e0b' }}>{t.status}</div>
                   </div>
                 ))}
              </div>
           </div>

           <h3 style={{ marginTop: '24px' }}>Workforce Heatmap (Live)</h3>
           <div className="kpi-card" style={{ background: '#111827', marginTop: '16px' }}>
              <div style={{ height: '150px', background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)', borderRadius: '4px', position: 'relative' }}>
                 <div style={{ position: 'absolute', top: '40px', left: '60px', width: '20px', height: '20px', background: '#ef4444', borderRadius: '50%', filter: 'blur(8px)', opacity: 0.8 }}></div>
                 <div style={{ textAlign: 'center', paddingTop: '60px', fontSize: '0.75rem', fontWeight: 700 }}>CONGESTION AT LEVEL 4</div>
              </div>
              <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem' }}>
                 <span>Total Workforce On-site</span>
                 <span style={{ fontWeight: 900 }}>1,142</span>
              </div>
           </div>
        </div>
      </div>

      {/* Realtime Event Log & Propagation */}
      <div style={{ marginTop: '32px' }}>
         <h3>Distributed Operational Event Fabric</h3>
         <div className="erp-table-container" style={{ background: '#0a0a0a', border: '1px solid #1e293b' }}>
            <table className="erp-table">
               <thead>
                  <tr>
                     <th>Timestamp</th>
                     <th>Source</th>
                     <th>Event Type</th>
                     <th>Propagation & AI Action</th>
                     <th>Status</th>
                  </tr>
               </thead>
               <tbody>
                  <tr>
                     <td style={{ fontSize: '0.75rem', opacity: 0.6 }}>11:42:15</td>
                     <td>IOT:Excavator-05</td>
                     <td>FUEL_ANOMALY_DETECTED</td>
                     <td>AI matched Fuel theft pattern. Triggered Audit Workflow #882. Escalated to Security.</td>
                     <td><span className="badge" style={{ background: '#ef4444' }}>ACTION TAKEN</span></td>
                  </tr>
                  <tr>
                     <td style={{ fontSize: '0.75rem', opacity: 0.6 }}>11:40:02</td>
                     <td>BIM:SyncEngine</td>
                     <td>QTY_MISMATCH_SLAB_T4</td>
                     <td>Updated EAC Forecast (+120M). Notified PM & Procurement for slab adjustment.</td>
                     <td><span className="badge" style={{ background: '#3b82f6' }}>LOGGED</span></td>
                  </tr>
                  <tr>
                     <td style={{ fontSize: '0.75rem', opacity: 0.6 }}>11:38:55</td>
                     <td>EXT:WeatherAPI</td>
                     <td>HEAVY_RAIN_WARNING</td>
                     <td>Recalculated Delay Risk (↑ 4 days). Updated Schedule Risk Radar.</td>
                     <td><span className="badge" style={{ background: '#10b981' }}>SYSTEM UPDATED</span></td>
                  </tr>
               </tbody>
            </table>
         </div>
      </div>
    </div>
  );
};
