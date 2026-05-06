"use client";

import React from 'react';

interface KPICardProps {
  label: string;
  value: string;
  trend?: string;
  trendType?: 'up' | 'down';
  color?: string;
  subValue?: string;
}

const KPICard: React.FC<KPICardProps> = ({ label, value, trend, trendType, color, subValue }) => (
  <div className="kpi-card">
    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600 }}>{label}</div>
    <div className="kpi-value" style={{ color }}>{value}</div>
    {subValue && <div className="text-muted" style={{ fontSize: '0.75rem', marginTop: '-4px' }}>{subValue}</div>}
    {trend && (
      <div className="kpi-trend" style={{ color: trendType === 'up' ? 'var(--status-healthy)' : 'var(--status-critical)' }}>
        {trendType === 'up' ? '↑' : '↓'} {trend}
      </div>
    )}
  </div>
);

const ProgressBar = ({ value, label, color }: { value: number, label: string, color: string }) => (
  <div style={{ marginBottom: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{value}%</span>
    </div>
    <div className="indicator">
      <div className="indicator-fill" style={{ width: `${value}%`, background: color }}></div>
    </div>
  </div>
);

export const ProjectCommandCenter = () => {
  return (
    <div className="project-command-center">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-xl)' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Dự án: Landmark 81 Tower</h1>
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            <span className="text-muted">PM: Nguyễn Văn A</span>
            <span style={{ padding: '2px 8px', borderRadius: '4px', background: 'var(--status-healthy)', fontSize: '0.75rem', fontWeight: 700 }}>ACTIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost">Dữ liệu thô</button>
          <button className="btn btn-primary">Xuất báo cáo</button>
        </div>
      </div>

      <h3 style={{ marginBottom: 'var(--space-md)', color: 'var(--brand-primary)' }}>1. TÀI CHÍNH DỰ ÁN (Financial Intelligence)</h3>
      <div className="kpi-grid">
        <KPICard label="Tổng ngân sách" value="1,250.0B" color="var(--finance-budget)" subValue="Budget" />
        <KPICard label="Chi phí cam kết" value="845.2B" color="var(--finance-committed)" subValue="Committed (PO + Subcon)" trend="15% vs Last Month" trendType="up" />
        <KPICard label="Chi phí thực tế" value="412.5B" color="var(--finance-actual)" subValue="Actual Cost (AC)" />
        <KPICard label="Dự báo khi hoàn thành" value="1,280.4B" color="var(--finance-forecast)" subValue="EAC (Estimate at Completion)" trend="2.4% Variance" trendType="down" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 'var(--space-xl)' }}>
        {/* Left Column: WIP & Margin Analysis */}
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <h3>Phân tích Lợi nhuận & WIP</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-xl)', marginTop: '24px' }}>
            <div>
              <ProgressBar value={82} label="Sản lượng thực hiện (Earned Value)" color="var(--status-info)" />
              <ProgressBar value={68} label="Đã xuất hóa đơn (Billed)" color="var(--brand-secondary)" />
              <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px' }}>
                <div className="text-muted">Trạng thái WIP</div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-healthy)' }}>UNDERBILLED (+14.2B)</div>
                <p className="text-muted" style={{ fontSize: '0.65rem', marginTop: '4px' }}>Khối lượng thi công đang vượt khối lượng hóa đơn. Cần đẩy nhanh thanh toán.</p>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="kpi-card" style={{ background: '#0f172a' }}>
                  <div className="text-muted">Chỉ số hiệu quả (CPI)</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-healthy)' }}>1.12</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>Dự án đang kiểm soát chi phí tốt.</div>
                </div>
                <div className="kpi-card" style={{ background: '#0f172a' }}>
                  <div className="text-muted">Lợi nhuận dự kiến</div>
                  <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--status-warning)' }}>12.4%</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem' }}>Giảm 1.2% so với kế hoạch ban đầu.</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Risk & Alerts */}
        <div className="kpi-card" style={{ borderColor: 'var(--status-critical)', cursor: 'default' }}>
          <h3 style={{ color: 'var(--status-critical)' }}>Cảnh báo Rủi ro (Critical Alerts)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '16px' }}>
            <div style={{ padding: '12px', background: 'rgba(239, 68, 68, 0.1)', borderLeft: '4px solid var(--status-critical)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Lãng phí vật tư: Thép CB400</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Actual consumption vượt 8% so với định mức thi công tại WBS.1.2.</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(245, 158, 11, 0.1)', borderLeft: '4px solid var(--status-warning)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Chậm thanh toán: Đợt 4 (Landmark)</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Quá hạn 12 ngày. Số tiền: 42.5B. Rủi ro dòng tiền cấp độ 2.</div>
            </div>
            <div style={{ padding: '12px', background: 'rgba(139, 92, 246, 0.1)', borderLeft: '4px solid var(--brand-secondary)', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.875rem' }}>Phê duyệt tồn đọng (12)</div>
              <div className="text-muted" style={{ fontSize: '0.75rem' }}>Gồm 4 đơn mua hàng (PO) và 2 yêu cầu nghiệm thu thầu phụ.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
