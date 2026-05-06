"use client";

import React from 'react';

const DocRow = ({ name, type, date, size, status, linkedTo }: any) => (
  <tr>
    <td>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <span style={{ fontSize: '1.25rem' }}>{type === 'PDF' ? '📄' : '🖼️'}</span>
        <div>
          <div style={{ fontWeight: 600 }}>{name}</div>
          <div className="text-muted" style={{ fontSize: '0.65rem' }}>v1.0 • {size}</div>
        </div>
      </div>
    </td>
    <td><span className="text-muted" style={{ fontSize: '0.75rem' }}>{type}</span></td>
    <td><span className="text-muted" style={{ fontSize: '0.75rem' }}>{date}</span></td>
    <td>
      <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', cursor: 'pointer', textDecoration: 'underline' }}>
        {linkedTo}
      </span>
    </td>
    <td>
      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Xem</button>
        <button className="btn btn-ghost" style={{ padding: '4px 8px', fontSize: '0.7rem' }}>Tải về</button>
      </div>
    </td>
  </tr>
);

export const DocumentCenter = () => {
  return (
    <div className="document-center" style={{ marginTop: 'var(--space-xl)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
        <h3>Quản lý Hồ sơ & Chứng từ (DMS)</h3>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-ghost">Tải lên hàng loạt</button>
          <button className="btn btn-primary">+ Tải hồ sơ mới</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 3fr', gap: 'var(--space-xl)' }}>
        {/* Folders/Tags */}
        <div className="kpi-card" style={{ cursor: 'default' }}>
          <h4>Thư mục</h4>
          <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ padding: '8px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '4px', cursor: 'pointer', color: 'var(--brand-primary)', fontWeight: 700 }}>📁 Tất cả hồ sơ</div>
            <div style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>📁 Hợp đồng (Contracts)</div>
            <div style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>📁 Bản vẽ (Drawings)</div>
            <div style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>📁 Nhật ký hiện trường</div>
            <div style={{ padding: '8px', borderRadius: '4px', cursor: 'pointer' }}>📁 Chứng từ kế toán</div>
          </div>

          <h4 style={{ marginTop: '32px' }}>Tags thông minh</h4>
          <div style={{ marginTop: '16px', display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'var(--erp-border)', borderRadius: '12px' }}>#HighRisk</span>
            <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'var(--erp-border)', borderRadius: '12px' }}>#PendingApproval</span>
            <span style={{ fontSize: '0.7rem', padding: '4px 8px', background: 'var(--erp-border)', borderRadius: '12px' }}>#LandmarkProject</span>
          </div>
        </div>

        {/* File List */}
        <div className="erp-table-container">
          <table className="erp-table">
            <thead>
              <tr>
                <th style={{ width: '40%' }}>Tên Hồ Sơ</th>
                <th>Loại</th>
                <th>Ngày tải lên</th>
                <th>Liên kết thực thể</th>
                <th style={{ textAlign: 'right' }}>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              <DocRow name="Hợp đồng thầu phụ M&E - Đợt 2.pdf" type="PDF" date="12/05/2026" size="2.4 MB" linkedTo="Subcon #452" />
              <DocRow name="Bản vẽ hố móng - Rev 4.dwg" type="IMG" date="11/05/2026" size="14.2 MB" linkedTo="WBS.1.1" />
              <DocRow name="Ảnh hiện trường đổ bê tông sàn 24.jpg" type="IMG" date="10/05/2026" size="1.1 MB" linkedTo="Progress #882" />
              <DocRow name="Invoice - Mua thép Hòa Phát.pdf" type="PDF" date="09/05/2026" size="0.8 MB" linkedTo="Invoice #INV-24" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
