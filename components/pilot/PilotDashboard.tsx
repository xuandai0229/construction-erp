"use client";

import React from 'react';

const FrictionItem = ({ name, level, reason }: any) => (
  <div style={{ padding: '12px', background: 'var(--erp-card)', borderRadius: '8px', marginBottom: '8px', borderLeft: `4px solid ${level === 'High' ? 'var(--status-critical)' : 'var(--status-warning)'}` }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
      <span style={{ fontWeight: 700, fontSize: '0.875rem' }}>{name}</span>
      <span style={{ fontSize: '0.7rem', fontWeight: 900 }}>{level} Friction</span>
    </div>
    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Lý do: {reason}</div>
  </div>
);

export const PilotDashboard = () => {
  return (
    <div className="pilot-dashboard" style={{ marginTop: 'var(--space-xl)' }}>
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>Pilot Project: Landmark 81 - Phase A Validation</h2>

      <div className="kpi-grid">
        <div className="kpi-card">
          <div className="text-muted">Adoption Rate</div>
          <div className="kpi-value">84%</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Site Engineers & QS</div>
        </div>
        <div className="kpi-card">
          <div className="text-muted">Avg. Workflow Time</div>
          <div className="kpi-value">14.2m</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>↓ 15% vs Last Week</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-critical)' }}>
          <div className="text-muted">Manual Bypasses</div>
          <div className="kpi-value">4</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Zalo usage detected</div>
        </div>
        <div className="kpi-card">
          <div className="text-muted">Incident Count</div>
          <div className="kpi-value">2</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Minor sync failures</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginTop: 'var(--space-xl)' }}>
        <div>
          <h3>Ma sát Vận hành (Friction Heatmap)</h3>
          <div style={{ marginTop: '16px' }}>
            <FrictionItem name="Nhập Nhật ký đo đạc (MB)" level="High" reason="Quá nhiều bước nhập thủ công cho các hạng mục chi tiết." />
            <FrictionItem name="Phê duyệt Đơn mua hàng" level="High" reason="Người duyệt (Director) không nhận được notification kịp thời." />
            <FrictionItem name="Đối soát vật tư" level="Medium" reason="Sai lệch đơn vị tính giữa PO và Warehouse." />
            <FrictionItem name="Báo cáo tiến độ" level="Low" reason="Mượt mà, người dùng thích giao diện chụp ảnh." />
          </div>

          <h3 style={{ marginTop: '32px' }}>Phản hồi từ Người dùng (UX Feedback)</h3>
          <div className="kpi-card" style={{ marginTop: '16px', cursor: 'default' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-primary)', flexShrink: 0 }}></div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Kỹ sư hiện trường B</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>"Giao diện mobile rất đẹp nhưng các nút bấm khi trời nắng gắt hơi khó nhìn. Cần tăng độ tương phản."</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '12px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand-secondary)', flexShrink: 0 }}></div>
              <div>
                <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Kế toán công trình A</div>
                <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>"Hệ thống tự đối soát Ledger rất tốt, giúp tôi tiết kiệm 2 tiếng mỗi ngày so với dùng Excel."</div>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3>Ưu tiên tinh chỉnh (Refinement Priorities)</h3>
          <div className="erp-table-container" style={{ marginTop: '16px' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Hạng mục</th>
                  <th>Loại</th>
                  <th>Ưu tiên</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Tối ưu nút bấm Mobile (High Contrast)</td>
                  <td>UI/UX</td>
                  <td><span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>P0</span></td>
                </tr>
                <tr>
                  <td>Tự động hóa Mapping BOQ → WBS</td>
                  <td>Workflow</td>
                  <td><span style={{ color: 'var(--status-warning)', fontWeight: 700 }}>P1</span></td>
                </tr>
                <tr>
                  <td>Hệ thống Notification Realtime</td>
                  <td>Infra</td>
                  <td><span style={{ color: 'var(--status-warning)', fontWeight: 700 }}>P1</span></td>
                </tr>
                <tr>
                  <td>Báo cáo EAC nâng cao</td>
                  <td>Feature</td>
                  <td><span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>P2</span></td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="kpi-card" style={{ marginTop: '16px', background: 'var(--status-healthy)', color: 'white' }}>
            <h4>Đánh giá mức độ trưởng thành (Maturity)</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
               <div style={{ fontSize: '1.5rem', fontWeight: 900 }}>78%</div>
               <div style={{ fontSize: '0.75rem', opacity: 0.8 }}>Dự án Pilot đã tự vận hành ổn định mà không cần sự can thiệp từ đội dev. Sẵn sàng Rollout mở rộng.</div>
            </div>
            <button className="btn" style={{ background: 'white', color: 'var(--status-healthy)', width: '100%', marginTop: '16px', justifyContent: 'center' }}>XUẤT BÁO CÁO PILOT</button>
          </div>
        </div>
      </div>
    </div>
  );
};
