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

const sanitizeValue = (val: any) => {
  if (val === null || val === undefined || val !== val) return '—';
  return val;
};

const KPICard: React.FC<KPICardProps> = ({ label, value, trend, trendType, color, subValue }) => (
  <div className="kpi-card">
    <div className="text-muted" style={{ fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.5px' }}>{label}</div>
    <div className="kpi-value" style={{ color, fontSize: '22px' }}>{sanitizeValue(value)}</div>
    {subValue && <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '0px' }}>{subValue}</div>}
    {trend && (
      <div className="kpi-trend" style={{ color: trendType === 'up' ? 'var(--status-healthy)' : 'var(--status-critical)', fontSize: '12px' }}>
        {trendType === 'up' ? '↑' : '↓'} {sanitizeValue(trend)}
      </div>
    )}
  </div>
);

const ProgressBar = ({ value, label, color }: { value: number, label: string, color: string }) => (
  <div style={{ marginBottom: '12px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
      <span>{label}</span>
      <span style={{ fontWeight: 700 }}>{sanitizeValue(value)}%</span>
    </div>
    <div className="indicator">
      <div className="indicator-fill" style={{ width: `${sanitizeValue(value)}%`, background: color }}></div>
    </div>
  </div>
);

export const ProjectCommandCenter = () => {
  return (
    <div className="project-command-center" style={{ marginTop: '-8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>Dự án: Landmark 81 Tower</h1>
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <span className="text-muted" style={{ fontSize: '0.875rem' }}>PM: Nguyễn Văn A</span>
            <span style={{ padding: '3px 10px', borderRadius: '4px', background: '#10b981', color: 'white', fontSize: '0.7rem', fontWeight: 700 }}>ACTIVE</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary" style={{ fontSize: '12px' }}>Dữ liệu thô</button>
          <button className="btn btn-primary" style={{ fontSize: '12px' }}>Xuất báo cáo</button>
        </div>
      </div>

      <h3 style={{ marginBottom: '12px', marginTop: '0px' }}>1. TÀI CHÍNH DỰ ÁN (Financial Intelligence)</h3>
      <div className="kpi-grid">
        <KPICard label="Tổng ngân sách" value="1,250.0B" color="#10b981" subValue="Budget" />
        <KPICard label="Chi phí cam kết" value="845.2B" color="#3b82f6" subValue="Committed" trend="15% vs LM" trendType="up" />
        <KPICard label="Chi phí thực tế" value="412.5B" color="#f59e0b" subValue="Actual Cost" />
        <KPICard label="Dự báo hoàn thành" value="1,280.4B" color="#8b5cf6" subValue="EAC" trend="2.4% Variance" trendType="down" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '18px', marginTop: '18px' }}>
        {/* Left Column: WIP & Margin Analysis */}
        <div className="kpi-card" style={{ cursor: 'default', padding: '18px', minHeight: 'auto', justifyContent: 'flex-start' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', margin: '0 0 14px 0' }}>Phân tích Lợi nhuận & WIP</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <ProgressBar value={82} label="Sản lượng thực hiện" color="#3b82f6" />
              <ProgressBar value={68} label="Đã xuất hóa đơn" color="#8b5cf6" />
              <div style={{ marginTop: '14px', padding: '12px', background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', borderRadius: '8px', border: '1px solid #bfdbfe' }}>
                <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Trạng thái WIP</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 700, color: '#10b981', marginTop: '4px' }}>UNDERBILLED</div>
                <p className="text-muted" style={{ fontSize: '0.65rem', marginTop: '4px', lineHeight: 1.4 }}>+14.2B | Cần đẩy nhanh thanh toán</p>
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f0f9ff 0%, #f8fafc 100%)', padding: '12px 14px', border: '1px solid #bfdbfe' }}>
                  <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Chỉ số hiệu quả</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>1.12</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem', marginTop: '2px' }}>Kiểm soát chi phí tốt</div>
                </div>
                <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #fef3c7 0%, #fefce8 100%)', padding: '12px 14px', border: '1px solid #fde047' }}>
                  <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Lợi nhuận dự kiến</div>
                  <div style={{ fontSize: '1.375rem', fontWeight: 700, color: '#f59e0b', marginTop: '2px' }}>12.4%</div>
                  <div className="text-muted" style={{ fontSize: '0.65rem', marginTop: '2px' }}>-1.2% vs kế hoạch</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Risk & Alerts */}
        <div className="kpi-card" style={{ cursor: 'default', padding: '18px', minHeight: 'auto', justifyContent: 'flex-start', borderColor: '#fee2e2', background: 'linear-gradient(135deg, #fef2f2 0%, #ffe4e6 100%)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#dc2626', margin: '0 0 12px 0' }}>Cảnh báo Rủi ro (Critical)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '10px 12px', background: 'rgba(239, 68, 68, 0.08)', borderLeft: '3px solid #ef4444', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#991b1b' }}>Lãng phí vật tư: Thép</div>
              <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>Vượt 8% định mức tại WBS.1.2</div>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(245, 158, 11, 0.08)', borderLeft: '3px solid #f59e0b', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#92400e' }}>Chậm thanh toán: Đợt 4</div>
              <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>Quá hạn 12 ngày | 42.5B</div>
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(139, 92, 246, 0.08)', borderLeft: '3px solid #8b5cf6', borderRadius: '4px' }}>
              <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#5b21b6' }}>Phê duyệt tồn đọng</div>
              <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>12 items: 4 PO + 2 Subcon</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
