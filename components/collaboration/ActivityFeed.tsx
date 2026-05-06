"use client";

import React from 'react';

const ActivityItem = ({ user, action, entity, time, message, avatarColor }: any) => (
  <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', position: 'relative' }}>
    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: avatarColor, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.75rem' }}>
      {user.charAt(0)}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontSize: '0.875rem' }}>
        <span style={{ fontWeight: 700 }}>{user}</span> {action} <span style={{ color: 'var(--brand-primary)', fontWeight: 600 }}>{entity}</span>
      </div>
      <div style={{ fontSize: '0.75rem', marginTop: '4px', color: 'var(--erp-text-muted)' }}>{message}</div>
      <div className="text-muted" style={{ fontSize: '0.65rem', marginTop: '4px' }}>{time}</div>
    </div>
  </div>
);

export const ActivityFeed = () => {
  return (
    <div className="activity-feed">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h4>Hoạt động & Thảo luận</h4>
        <button className="btn btn-ghost" style={{ padding: '2px 8px', fontSize: '0.65rem' }}>Lọc theo dự án</button>
      </div>

      <div style={{ background: 'var(--erp-card)', borderRadius: '12px', padding: '20px', border: '1px solid var(--erp-border)', height: '500px', overflowY: 'auto' }}>
        <ActivityItem user="Nguyễn Văn A" action="đã phê duyệt" entity="Hóa đơn #452" time="10 phút trước" message="Số tiền khớp với chứng từ gốc. Đã đối soát ngân sách." avatarColor="var(--status-healthy)" />
        <ActivityItem user="Trần Thị B" action="đã tải lên" entity="Ảnh nghiệm thu" time="45 phút trước" message="Công tác đổ bê tông sàn tầng 15 đã hoàn tất." avatarColor="var(--brand-primary)" />
        
        {/* Comment Entry */}
        <div style={{ margin: '24px 0', padding: '16px', background: 'rgba(59, 130, 246, 0.05)', borderRadius: '8px', border: '1px dashed var(--brand-primary)' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 700, marginBottom: '8px' }}>Thêm thảo luận mới</div>
          <input type="text" placeholder="Nhập ý kiến hoặc nhắc tên @ đồng nghiệp..." style={{ width: '100%', background: '#0f172a', border: '1px solid var(--erp-border)', borderRadius: '4px', padding: '8px', color: 'white', fontSize: '0.875rem' }} />
        </div>

        <ActivityItem user="Lê Văn C" action="đã từ chối" entity="Yêu cầu mua hàng #12" time="2 giờ trước" message="Đơn giá thép đang cao hơn mức cho phép. Cần tìm nhà cung cấp khác." avatarColor="var(--status-critical)" />
        <ActivityItem user="Phạm Văn D" action="đã chốt sổ" entity="Kỳ kế toán 04/2026" time="5 giờ trước" message="Dữ liệu đã được kiểm toán và đối soát Ledger." avatarColor="var(--brand-secondary)" />
        <ActivityItem user="System" action="cảnh báo" entity="Lãng phí vật tư" time="Hôm qua" message="Phát hiện hao hụt 12% thép tại Trục A dự án Landmark." avatarColor="#334155" />
      </div>
    </div>
  );
};
