"use client";

import React from 'react';

const RolloutWave = ({ name, status, projects, progress }: any) => (
  <div className="kpi-card" style={{ marginBottom: '24px', cursor: 'default' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
      <div>
        <h4 style={{ margin: 0 }}>Wave {name}</h4>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Trạng thái: <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>{status}</span></div>
      </div>
      <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{progress}%</div>
    </div>
    
    <div className="indicator" style={{ height: '6px' }}>
      <div className="indicator-fill" style={{ width: `${progress}%`, background: 'var(--brand-primary)' }}></div>
    </div>

    <div style={{ marginTop: '16px' }}>
      <div className="text-muted" style={{ fontSize: '0.7rem', marginBottom: '8px' }}>Dự án tham gia:</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
        {projects.map((p: string) => (
          <span key={p} style={{ fontSize: '0.7rem', padding: '2px 8px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', border: '1px solid var(--erp-border)' }}>{p}</span>
        ))}
      </div>
    </div>
  </div>
);

export const RolloutDashboard = () => {
  return (
    <div className="rollout-dashboard" style={{ marginTop: 'var(--space-xl)' }}>
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>ERP Deployment & Rollout Command Center</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-xl)' }}>
        <div>
          <h3>Lộ trình triển khai (Deployment Waves)</h3>
          <div style={{ marginTop: '16px' }}>
            <RolloutWave name="1: FINANCE CORE" status="ACTIVE" progress={100} projects={['Landmark 81', 'Vinhomes Central Park', 'Thủ Thiêm 2']} />
            <RolloutWave name="2: OPERATIONS & SITE" status="IN PROGRESS" progress={65} projects={['Landmark 81', 'Vinhomes Central Park']} />
            <RolloutWave name="3: ADVANCED ANALYTICS" status="PLANNED" progress={0} projects={['Landmark 81']} />
          </div>

          <h3 style={{ marginTop: '32px' }}>Checklist Chuyển đổi (Cutover Checklist)</h3>
          <div className="erp-table-container" style={{ marginTop: '16px' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Nhiệm vụ</th>
                  <th>Phụ trách</th>
                  <th>Hạn chót</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Chốt số dư Excel (Freeze)</td>
                  <td>Kế toán trưởng</td>
                  <td>15/05/2026</td>
                  <td><span style={{ color: 'var(--status-healthy)' }}>COMPLETED</span></td>
                </tr>
                <tr>
                  <td>Import Vendor Master List</td>
                  <td>Procurement</td>
                  <td>16/05/2026</td>
                  <td><span style={{ color: 'var(--brand-primary)' }}>IN PROGRESS</span></td>
                </tr>
                <tr>
                  <td>Đào tạo Site Engineers (Wave 2)</td>
                  <td>ERP Team</td>
                  <td>18/05/2026</td>
                  <td><span style={{ color: 'var(--status-warning)' }}>PENDING</span></td>
                </tr>
                <tr>
                  <td>Thiết lập Approval Hierarchy</td>
                  <td>HR / Director</td>
                  <td>20/05/2026</td>
                  <td><span style={{ color: 'var(--status-warning)' }}>PENDING</span></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3>Quản trị thay đổi (Change Management)</h3>
          <div className="kpi-card" style={{ marginTop: '16px', background: 'rgba(139, 92, 246, 0.05)' }}>
            <h4>Tỷ lệ chuyển đổi Excel → ERP</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', margin: '20px 0' }}>
               <div style={{ width: '80px', height: '80px', borderRadius: '50%', border: '8px solid var(--status-healthy)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.25rem' }}>74%</div>
               <div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Giảm thiểu Shadow Workflows</div>
                  <div className="text-muted" style={{ fontSize: '0.7rem' }}>74% nghiệp vụ đã được chuyển hẳn sang ERP, bỏ qua Excel/Zalo.</div>
               </div>
            </div>

            <h4>Rủi ro Triển khai (Critical Risks)</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
               <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--status-critical)', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Sai lệch số dư đầu kỳ (Inventory)</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Dữ liệu tồn kho Excel không khớp thực tế tại Kho Landmark.</div>
               </div>
               <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid var(--status-warning)', borderRadius: '4px' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Kháng cự người dùng hiện trường</div>
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>Site Engineers báo cáo giao diện di động khó dùng trong điều kiện nắng nóng.</div>
               </div>
            </div>
          </div>

          <div className="kpi-card" style={{ marginTop: '16px', background: 'var(--brand-primary)', color: 'white' }}>
            <h4 style={{ marginBottom: '8px' }}>War-room: Go-live Support</h4>
            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Hỗ trợ 24/7 trong giai đoạn Hypercare. Liên hệ hotline ERP để được giải quyết sự cố tức thì.</p>
            <button className="btn" style={{ background: 'white', color: 'var(--brand-primary)', width: '100%', marginTop: '16px', justifyContent: 'center' }}>VÀO PHÒNG HỖ TRỢ</button>
          </div>
        </div>
      </div>
    </div>
  );
};
