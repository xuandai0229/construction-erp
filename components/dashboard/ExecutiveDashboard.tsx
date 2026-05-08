"use client";

import React from 'react';

const sanitizeValue = (val: any) => {
  if (val === null || val === undefined || val !== val) return '—';
  return val;
};

const ProjectProgressCard = ({ name, progress, health, margin, variance }: any) => (
  <div className="erp-table-container" style={{ marginBottom: '12px', padding: '14px', border: '1px solid #e0e7ff' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
      <div>
        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 700 }}>{name}</h4>
        <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '2px' }}>Landmark Group • Q1 2026</div>
      </div>
      <div style={{ padding: '3px 10px', borderRadius: '20px', background: health === 'Healthy' ? '#ecfdf5' : '#fee2e2', color: health === 'Healthy' ? '#10b981' : '#ef4444', fontSize: '0.65rem', fontWeight: 700 }}>
        {health}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', fontSize: '13px' }}>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Tiến độ</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', marginTop: '2px' }}>{sanitizeValue(progress)}%</div>
        <div className="indicator" style={{ height: '4px', marginTop: '4px' }}>
          <div className="indicator-fill" style={{ width: `${sanitizeValue(progress)}%`, background: '#3b82f6' }}></div>
        </div>
      </div>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Lợi nhuận</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: margin < 15 ? '#f59e0b' : '#10b981', marginTop: '2px' }}>{sanitizeValue(margin)}%</div>
      </div>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Dòng tiền</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: '#10b981', marginTop: '2px' }}>+12.4B</div>
      </div>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Variance</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: variance > 0 ? '#ef4444' : '#10b981', marginTop: '2px' }}>{variance > 0 ? `+${sanitizeValue(variance)}%` : '0%'}</div>
      </div>
    </div>
  </div>
);

export const ExecutiveDashboard = () => {
  return (
    <div className="executive-dashboard" style={{ marginTop: '0px' }}>
      <h2 style={{ marginBottom: '16px', fontSize: '24px', fontWeight: 700, color: '#1f2937' }}>Executive Intelligence Dashboard</h2>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%)', border: '1px solid #bfdbfe' }}>
          <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Tổng Doanh thu</div>
          <div className="kpi-value" style={{ color: '#1e40af', fontSize: '22px' }}>4,520.0B</div>
          <div className="text-muted" style={{ fontSize: '0.65rem' }}>Tất cả dự án</div>
        </div>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%)', border: '1px solid #86efac' }}>
          <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Lợi nhuận TB</div>
          <div className="kpi-value" style={{ color: '#10b981', fontSize: '22px' }}>18.2%</div>
          <div className="text-muted" style={{ fontSize: '0.65rem' }}>↑ 2.1% vs Năm ngoái</div>
        </div>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #fee2e2 0%, #fecaca 100%)', border: '1px solid #fca5a5' }}>
          <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Phơi nhiễm rủi ro</div>
          <div className="kpi-value" style={{ color: '#dc2626', fontSize: '22px' }}>142.5B</div>
          <div className="text-muted" style={{ fontSize: '0.65rem' }}>Vượt ngân sách</div>
        </div>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #f3e8ff 0%, #faf5ff 100%)', border: '1px solid #d8b4fe' }}>
          <div className="text-muted" style={{ fontSize: '0.7rem', fontWeight: 600 }}>Dòng tiền khả dụng</div>
          <div className="kpi-value" style={{ color: '#9333ea', fontSize: '22px' }}>840.2B</div>
          <div className="text-muted" style={{ fontSize: '0.65rem' }}>Sau Committed</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '18px', marginTop: '18px' }}>
        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>Theo dõi danh mục dự án (Portfolio)</h3>
          <div style={{ marginTop: '0' }}>
            <ProjectProgressCard name="Landmark 81 Tower" progress={85} health="Healthy" margin={18.5} variance={0} />
            <ProjectProgressCard name="Vinhomes Central Park - Lô C" progress={42} health="At Risk" margin={12.2} variance={8.4} />
            <ProjectProgressCard name="Cầu Thủ Thiêm 2 - Gói thầu 4" progress={15} health="Healthy" margin={22.0} variance={0} />
            <ProjectProgressCard name="Sân bay Long Thành - Nhà ga" progress={5} health="Healthy" margin={20.5} variance={0} />
          </div>
        </div>

        <div>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: '#1f2937', marginBottom: '12px' }}>Phân tích Rủi ro & Tồn đọng</h3>
          <div className="kpi-card" style={{ marginTop: '0px', cursor: 'default', padding: '14px 16px', minHeight: 'auto' }}>
            <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#1f2937' }}>Chậm thanh toán nhất</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Landmark 81</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>42.5B</span>
              </div>
            </div>
            <div style={{ marginBottom: '12px', paddingBottom: '12px', borderBottom: '1px solid #e5e7eb' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#1f2937' }}>Nhà thầu rủi ro</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>M&E Contractor X</span>
                <span style={{ color: '#f59e0b', fontWeight: 700 }}>Delay 15d</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: '4px', color: '#1f2937' }}>Vật tư giá cao</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                <span>Thép xây dựng</span>
                <span style={{ color: '#ef4444', fontWeight: 700 }}>+15.2%</span>
              </div>
            </div>
          </div>

          <div className="kpi-card" style={{ marginTop: '12px', background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', color: 'white', cursor: 'pointer', padding: '14px 16px', minHeight: 'auto', border: '1px solid #1e40af' }}>
            <h4 style={{ marginBottom: '6px', fontSize: '13px', fontWeight: 700 }}>Báo cáo Tổng hợp Q</h4>
            <p style={{ fontSize: '0.7rem', opacity: 0.9, marginBottom: '10px', lineHeight: 1.3 }}>Tất cả chỉ số tài chính & rủi ro sẵn sàng</p>
            <button className="btn" style={{ background: 'white', color: '#2563eb', width: '100%', padding: '6px 12px', fontSize: '11px', fontWeight: 700, height: 'auto', justifyContent: 'center' }}>XEM BÁO CÁO</button>
          </div>
        </div>
      </div>
    </div>
  );
};
