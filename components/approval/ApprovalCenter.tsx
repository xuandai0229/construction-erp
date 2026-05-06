"use client";

import React from 'react';

const ApprovalItem = ({ title, requester, date, amount, type, impact }: any) => (
  <div className="kpi-card" style={{ marginBottom: '12px', display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center' }}>
    <div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '4px' }}>
        <span style={{ fontSize: '0.65rem', padding: '2px 6px', background: 'rgba(59, 130, 246, 0.2)', color: 'var(--brand-primary)', borderRadius: '4px', fontWeight: 700 }}>{type}</span>
        <span className="text-muted" style={{ fontSize: '0.75rem' }}>#{Math.floor(Math.random() * 10000)}</span>
      </div>
      <div style={{ fontWeight: 600 }}>{title}</div>
      <div className="text-muted" style={{ fontSize: '0.75rem' }}>Yêu cầu bởi: {requester} • {date}</div>
    </div>
    <div style={{ textAlign: 'right' }}>
      <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>{amount}</div>
      <div style={{ fontSize: '0.75rem', color: impact === 'negative' ? 'var(--status-critical)' : 'var(--status-healthy)' }}>
        {impact === 'negative' ? 'Vượt ngân sách: 12.5%' : 'Trong ngân sách'}
      </div>
      <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
        <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Từ chối</button>
        <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Phê duyệt</button>
      </div>
    </div>
  </div>
);

export const ApprovalCenter = () => {
  return (
    <div className="approval-center" style={{ marginTop: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3>Trung tâm Phê duyệt (Approval Center)</h3>
        <div style={{ display: 'flex', gap: '16px' }}>
          <div className="text-muted">Chờ duyệt: <b>12</b></div>
          <div className="text-muted">Đã duyệt (24h): <b>45</b></div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: 'var(--space-xl)' }}>
        {/* Queue */}
        <div>
          <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
            <button className="btn btn-primary" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Tất cả</button>
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Mua hàng</button>
            <button className="btn btn-ghost" style={{ padding: '4px 12px', fontSize: '0.75rem' }}>Thanh toán</button>
          </div>
          <div style={{ height: '600px', overflowY: 'auto', paddingRight: '8px' }}>
            <ApprovalItem title="Mua thép Hòa Phát - Lô 42" requester="Procurement A" date="12/05/2026" amount="450,000,000" type="PO" impact="positive" />
            <ApprovalItem title="Thanh toán đợt 2 - Thầu phụ Điện" requester="QS Site B" date="12/05/2026" amount="1,240,000,000" type="PAYMENT" impact="negative" />
            <ApprovalItem title="Điều chỉnh BOQ: Hạng mục Cọc" requester="PM Center" date="11/05/2026" amount="+125,000,000" type="VARIATION" impact="negative" />
            <ApprovalItem title="Mua vật tư bảo hộ lao động" requester="HR Site" date="11/05/2026" amount="15,000,000" type="PO" impact="positive" />
          </div>
        </div>

        {/* Details Panel */}
        <div className="kpi-card" style={{ cursor: 'default', background: 'rgba(30, 41, 59, 0.4)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
            <h4>Chi tiết yêu cầu: #4582</h4>
            <span style={{ color: 'var(--brand-primary)', fontWeight: 700 }}>PENDING APPROVAL</span>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <div className="text-muted">Mô tả</div>
            <p style={{ marginTop: '8px' }}>Thanh toán khối lượng hoàn thành đợt 2 cho thầu phụ Cơ điện (M&E). Khối lượng đã được QS xác nhận tại hiện trường ngày 10/05.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', border: '1px solid var(--erp-border)' }}>
              <div className="text-muted">Ngân sách còn lại</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>4,500,000,000</div>
            </div>
            <div style={{ padding: '16px', background: '#0f172a', borderRadius: '8px', border: '1px solid var(--status-critical)' }}>
              <div className="text-muted">Giá trị yêu cầu</div>
              <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--status-critical)' }}>5,240,000,000</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--status-critical)' }}>Vượt 16.4% so với ngân sách WBS</div>
            </div>
          </div>

          <div style={{ marginBottom: '24px' }}>
            <h4>Luồng phê duyệt (Approval Chain)</h4>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--status-healthy)' }}></div>
                <div><b>Kỹ sư QS:</b> Nguyễn Văn B <span className="text-muted">Đã ký 10/05 14:20</span></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--status-healthy)' }}></div>
                <div><b>PM Dự án:</b> Trần Văn C <span className="text-muted">Đã ký 10/05 16:45</span></div>
              </div>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: 'var(--brand-primary)', boxShadow: '0 0 10px var(--brand-primary)' }}></div>
                <div><b>Giám đốc Tài chính (CFO):</b> <span style={{ color: 'var(--brand-primary)' }}>Đang chờ bạn phê duyệt</span></div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto' }}>
            <textarea placeholder="Nhập ý kiến phê duyệt hoặc lý do từ chối..." style={{ width: '100%', height: '80px', background: '#0f172a', border: '1px solid var(--erp-border)', borderRadius: '4px', padding: '12px', color: 'white', marginBottom: '16px' }}></textarea>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="btn btn-ghost" style={{ flex: 1 }}>TRẢ LẠI / YÊU CẦU GIẢI TRÌNH</button>
              <button className="btn btn-primary" style={{ flex: 1, background: 'var(--status-healthy)' }}>PHÊ DUYỆT NGAY</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
