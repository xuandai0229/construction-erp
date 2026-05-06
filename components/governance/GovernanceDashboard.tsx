"use client";

import React from 'react';

const ComplianceMetric = ({ label, score, status }: any) => (
  <div style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
      <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{label}</span>
      <span style={{ fontWeight: 700, color: score > 80 ? 'var(--status-healthy)' : 'var(--status-warning)' }}>{score}%</span>
    </div>
    <div className="indicator">
      <div className="indicator-fill" style={{ width: `${score}%`, background: score > 80 ? 'var(--status-healthy)' : 'var(--status-warning)' }}></div>
    </div>
    <div className="text-muted" style={{ fontSize: '0.65rem' }}>Trạng thái: <b>{status}</b></div>
  </div>
);

export const GovernanceDashboard = () => {
  return (
    <div className="governance-dashboard" style={{ marginTop: 'var(--space-xl)' }}>
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>ERP Governance & Adoption Intelligence</h2>

      <div className="kpi-grid">
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-healthy)' }}>
          <div className="text-muted">Tỷ lệ Adoption</div>
          <div className="kpi-value">92%</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Người dùng Active hàng ngày</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--brand-primary)' }}>
          <div className="text-muted">Kỷ luật vận hành</div>
          <div className="kpi-value">B+</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Theo Compliance Scorecard</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-warning)' }}>
          <div className="text-muted">Phê duyệt tồn đọng</div>
          <div className="kpi-value">24h+</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Thời gian duyệt trung bình</div>
        </div>
        <div className="kpi-card" style={{ borderLeft: '4px solid var(--status-critical)' }}>
          <div className="text-muted">Dữ liệu cần làm sạch</div>
          <div className="kpi-value">12</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Chứng từ thiếu thông tin</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-xl)', marginTop: 'var(--space-xl)' }}>
        <div>
          <h3>Chỉ số tuân thủ theo Bộ phận (Compliance Matrix)</h3>
          <div className="kpi-card" style={{ marginTop: '16px', padding: '24px' }}>
            <ComplianceMetric label="Phòng Kế toán (Audit & Ledger)" score={98} status="TUÂN THỦ TỐT" />
            <ComplianceMetric label="Phòng Vật tư (Procurement SLA)" score={85} status="ĐẠT YÊU CẦU" />
            <ComplianceMetric label="Ban chỉ huy công trường (Field Reporting)" score={62} status="CẦN CẢI THIỆN" />
            <ComplianceMetric label="Ban giám đốc (Approval Velocity)" score={78} status="CẦN TĂNG TỐC" />
          </div>

          <h3 style={{ marginTop: '32px' }}>Dự án cần lưu ý (Stale/Low Adoption)</h3>
          <div className="erp-table-container" style={{ marginTop: '16px' }}>
            <table className="erp-table">
              <thead>
                <tr>
                  <th>Tên Dự Án</th>
                  <th>PM</th>
                  <th>Hoạt động cuối</th>
                  <th>Mức độ rủi ro</th>
                  <th style={{ textAlign: 'right' }}>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Vinhomes Central Park - C3</td>
                  <td>Nguyễn Văn X</td>
                  <td>12 ngày trước</td>
                  <td><span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>CAO (No site reporting)</span></td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-ghost" style={{ fontSize: '0.7rem' }}>Gửi nhắc nhở</button></td>
                </tr>
                <tr>
                  <td>Landmark Tower (A2)</td>
                  <td>Trần Văn Y</td>
                  <td>4 giờ trước</td>
                  <td><span style={{ color: 'var(--status-healthy)', fontWeight: 700 }}>THẤP</span></td>
                  <td style={{ textAlign: 'right' }}><button className="btn btn-ghost" style={{ fontSize: '0.7rem' }}>Xem Audit</button></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <h3>Lộ trình Đào tạo & Onboarding</h3>
          <div className="kpi-card" style={{ marginTop: '16px', background: 'rgba(59, 130, 246, 0.05)' }}>
            <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '16px' }}>Tiến độ Onboarding (Tất cả nhân sự)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
               <div style={{ width: '60px', height: '60px', borderRadius: '50%', border: '5px solid var(--brand-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900 }}>82%</div>
               <div className="text-muted" style={{ fontSize: '0.75rem' }}>145/180 nhân sự đã hoàn thành khóa đào tạo vận hành.</div>
            </div>
            
            <h4>Hướng dẫn nhanh (Inline SOPs)</h4>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>📘 Quy trình Chốt kỳ kế toán</div>
              <div style={{ padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>📘 Quy trình Nhập nhật ký đo đạc (MB)</div>
              <div style={{ padding: '8px', background: '#0f172a', borderRadius: '4px', fontSize: '0.75rem', cursor: 'pointer' }}>📘 Quy trình Đối soát vật tư cuối tháng</div>
            </div>
          </div>

          <div className="kpi-card" style={{ marginTop: '16px', background: 'var(--brand-secondary)', color: 'white' }}>
            <h4>Báo cáo Kỷ luật định kỳ</h4>
            <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '8px' }}>Gửi báo cáo xếp hạng tuân thủ ERP của các bộ phận cho Ban Tổng Giám Đốc.</p>
            <button className="btn" style={{ background: 'white', color: 'var(--brand-secondary)', width: '100%', marginTop: '16px', justifyContent: 'center' }}>XUẤT BÁO CÁO TUÂN THỦ</button>
          </div>
        </div>
      </div>
    </div>
  );
};
