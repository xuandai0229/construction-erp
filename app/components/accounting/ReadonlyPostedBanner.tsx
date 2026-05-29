'use client';

import React from 'react';

interface ReadonlyPostedBannerProps {
  status: string;
  className?: string;
}

export default function ReadonlyPostedBanner({ status, className = "" }: ReadonlyPostedBannerProps) {
  const isLocked = ["POSTED", "PAID", "FULLY_SETTLED", "REVERSED", "CANCELLED"].includes(status.toUpperCase());

  if (!isLocked) return null;

  return (
    <div
      className={`flex items-center gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-lg text-amber-500 text-xs font-bold leading-normal select-none animate-fade-in ${className}`}
      id="readonly-posted-banner"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="2.5">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
        <path d="M7 11V7a5 5 0 0110 0v4" />
      </svg>
      <div className="flex-1">
        <span className="text-[13px] font-black uppercase block tracking-wider mb-0.5">Chứng từ đã ghi sổ ({status})</span>
        <span className="text-[11px] text-amber-400 font-semibold block leading-relaxed">
          Chế độ xem chỉ đọc (Read-only) đã được kích hoạt để bảo vệ tính toàn vẹn của Sổ Cái. Không thể chỉnh sửa trực tiếp số liệu tài chính. Vui lòng dùng nghiệp vụ đảo/hủy nếu cần điều chỉnh.
        </span>
      </div>
    </div>
  );
}
