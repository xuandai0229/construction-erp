"use client";

import React from 'react';

const ProjectProgressCard = ({ name, progress, health, margin, variance }: any) => (
  <div className="erp-table-container" style={{ marginBottom: '16px', padding: '16px' }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
      <div>
        <h4 style={{ margin: 0 }}>{name}</h4>
        <div className="text-muted" style={{ fontSize: '0.75rem' }}>Landmark Group • Q1 2026</div>
      </div>
      <div style={{ padding: '4px 12px', borderRadius: '20px', background: health === 'Healthy' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)', color: health === 'Healthy' ? 'var(--status-healthy)' : 'var(--status-critical)', fontSize: '0.7rem', fontWeight: 700 }}>
        {health}
      </div>
    </div>

    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px' }}>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Tiến độ</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>{progress}%</div>
        <div className="indicator" style={{ height: '4px' }}>
          <div className="indicator-fill" style={{ width: `${progress}%`, background: 'var(--brand-primary)' }}></div>
        </div>
      </div>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Lợi nhuận (Margin)</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: margin < 15 ? 'var(--status-warning)' : 'var(--status-healthy)' }}>{margin}%</div>
      </div>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Dòng tiền (Net)</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem' }}>+12.4B</div>
      </div>
      <div>
        <div className="text-muted" style={{ fontSize: '0.7rem' }}>Chênh lệch (Variance)</div>
        <div style={{ fontWeight: 700, fontSize: '1.125rem', color: variance > 0 ? 'var(--status-critical)' : 'inherit' }}>{variance > 0 ? `+${variance}%` : '0%'}</div>
      </div>
    </div>
  </div>
);

export const ExecutiveDashboard = () => {
  return (
    <div className="executive-dashboard" style={{ marginTop: 'var(--space-xl)' }}>
      <h2 style={{ marginBottom: 'var(--space-lg)' }}>Executive Intelligence Dashboard</h2>

      <div className="kpi-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
        <div className="kpi-card" style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', border: '1px solid var(--brand-primary)' }}>
          <div className="text-muted">Tổng Doanh thu Dự kiến</div>
          <div className="kpi-value">4,520.0B</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Tất cả dự án đang chạy</div>
        </div>
        <div className="kpi-card">
          <div className="text-muted">Lợi nhuận TB</div>
          <div className="kpi-value" style={{ color: 'var(--status-healthy)' }}>18.2%</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>↑ 2.1% vs Năm ngoái</div>
        </div>
        <div className="kpi-card">
          <div className="text-muted">Phơi nhiễm rủi ro</div>
          <div className="kpi-value" style={{ color: 'var(--status-critical)' }}>142.5B</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Vượt ngân sách & Chậm tiến độ</div>
        </div>
        <div className="kpi-card">
          <div className="text-muted">Dòng tiền khả dụng</div>
          <div className="kpi-value" style={{ color: 'var(--brand-secondary)' }}>840.2B</div>
          <div className="text-muted" style={{ fontSize: '0.7rem' }}>Sau khi trừ Committed Costs</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-xl)', marginTop: 'var(--space-xl)' }}>
        <div>
          <h3>Theo dõi danh mục dự án (Portfolio View)</h3>
          <div style={{ marginTop: '16px' }}>
            <ProjectProgressCard name="Landmark 81 Tower" progress={85} health="Healthy" margin={18.5} variance={0} />
            <ProjectProgressCard name="Vinhomes Central Park - Lô C" progress={42} health="At Risk" margin={12.2} variance={8.4} />
            <ProjectProgressCard name="Cầu Thủ Thiêm 2 - Gói thầu 4" progress={15} health="Healthy" margin={22.0} variance={0} />
            <ProjectProgressCard name="Sân bay Long Thành - Nhà ga" progress={5} health="Healthy" margin={20.5} variance={0} />
          </div>
        </div>

        <div>
          <h3>Phân tích Rủi ro & Tồn đọng</h3>
          <div className="kpi-card" style={{ marginTop: '16px', cursor: 'default' }}>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>Dự án chậm thanh toán nhất</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>Landmark 81</span>
                <span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>42.5B (Over 30 days)</span>
              </div>
            </div>
            <div style={{ marginBottom: '20px' }}>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>Nhà thầu phụ rủi ro nhất</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>M&E Contractor X</span>
                <span style={{ color: 'var(--status-warning)', fontWeight: 700 }}>Slow progress (Delay 15 days)</span>
              </div>
            </div>
            <div>
              <div style={{ fontSize: '0.875rem', fontWeight: 700, marginBottom: '8px' }}>Vật tư biến động giá mạnh</div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.875rem' }}>
                <span>Thép xây dựng</span>
                <span style={{ color: 'var(--status-critical)', fontWeight: 700 }}>+15.2% vs Budget</span>
              </div>
            </div>
          </div>

          <div className="kpi-card" style={{ marginTop: '16px', background: 'var(--brand-primary)', color: 'white', cursor: 'pointer' }}>
            <h4 style={{ marginBottom: '8px' }}>Báo cáo Tổng hợp Quý</h4>
            <p style={{ fontSize: '0.75rem', opacity: 0.8 }}>Tất cả các chỉ số tài chính, tiến độ và rủi ro đã sẵn sàng để trình Hội đồng quản trị.</p>
            <button className="btn" style={{ background: 'white', color: 'var(--brand-primary)', width: '100%', marginTop: '16px', justifyContent: 'center' }}>XEM BÁO CÁO FULL</button>
          </div>
        </div>
      </div>
    </div>
  );
};
