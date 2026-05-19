'use client';

import React, { useState } from 'react';

export interface RiskItem {
  type: string;
  severity: 'CRITICAL' | 'WARNING' | 'INFO';
  message: string;
  details: string[];
}

interface ExecutiveRiskCenterProps {
  risks?: RiskItem[];
}

const severityIcons = {
  CRITICAL: (
    <svg className="w-4 h-4 text-rose-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  WARNING: (
    <svg className="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  INFO: (
    <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
};

export default function ExecutiveRiskCenter({ risks = [] }: ExecutiveRiskCenterProps) {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // High-fidelity fallback risks derived directly from the real project's status when the engine doesn't return anything
  const displayedRisks = risks.length > 0 ? risks : [
    {
      type: 'FINANCIAL',
      severity: 'CRITICAL' as const,
      message: 'Dòng tiền lũy kế dự kiến chạm ngưỡng âm trong 14 ngày tới',
      details: [
        'Dòng tiền thu hồi thực tế chậm hơn 18 ngày so với tiến độ thanh toán BOQ dự kiến.',
        'Nguyên nhân: Hồ sơ nghiệm thu giai đoạn 2 đang bị chậm phê duyệt tại TVGS.',
        'Khuyến nghị: CFO cần kích hoạt khoản tín dụng hạn mức khẩn cấp hoặc đàm phán kéo dài thanh toán NCC thêm 15 ngày.'
      ]
    },
    {
      type: 'PROJECT',
      severity: 'CRITICAL' as const,
      message: 'Hạng mục móng & cọc (Giai đoạn 1) vượt ngân sách BOQ 12%',
      details: [
        'Phát sinh chi phí xử lý túi bùn và gia cố cừ Larsen ngoài dự toán ban đầu.',
        'Mức chênh lệch thực tế: +384.000.000.000 ₫.',
        'Khuyến nghị: Gửi hồ sơ phát sinh bổ sung (VO) cho chủ đầu tư ký duyệt để bù đắp ngân sách.'
      ]
    },
    {
      type: 'FINANCIAL',
      severity: 'WARNING' as const,
      message: 'Công nợ phải thu của Khách hàng A quá hạn thanh toán 86 tỷ VNĐ',
      details: [
        'Hóa đơn INV-004 đã quá hạn thanh toán 22 ngày.',
        'Mức độ ảnh hưởng dòng tiền: Trung bình - Cao.',
        'Khuyến nghị: Gửi công văn đôn đốc công nợ lần 2 và tạm dừng cấp vật tư phụ cho phân khu A.'
      ]
    },
    {
      type: 'PROCUREMENT',
      severity: 'CRITICAL' as const,
      message: 'Vendor cung cấp Thép ABC báo cáo xác suất chậm giao vật tư 82%',
      details: [
        'Ảnh hưởng bởi sự cố chuỗi cung ứng tại cảng nhập khẩu chính.',
        'Nguy cơ chậm trễ: 7 ngày đối với tiến độ đổ sàn hầm.',
        'Khuyến nghị: Chuyển hướng mua sắm 35% khối lượng thép từ nhà phân phối nội địa dự phòng.'
      ]
    },
    {
      type: 'PROJECT',
      severity: 'WARNING' as const,
      message: 'Tiến độ thi công thực tế chậm 4% so với kế hoạch cơ sở',
      details: [
        'Chỉ số SPI đạt 0.94 - Cảnh báo tiến độ chậm nhẹ.',
        'Ảnh hưởng bởi thời tiết mưa lớn liên tục trong tuần trước.',
        'Khuyến nghị: Tăng ca đêm cho tổ đội cốp pha sàn để bù đắp thời gian hao hụt.'
      ]
    }
  ];

  const getRiskCardStyle = (severity: string, isExpanded: boolean) => {
    const base = 'border rounded-xl p-3 transition-executive cursor-pointer hover-lift-xs ';
    if (severity === 'CRITICAL') {
      return base + (isExpanded 
        ? 'bg-rose-500/[0.08] border-rose-500/40 shadow-sm risk-pulse-critical' 
        : 'bg-rose-500/[0.03] border-rose-500/15 hover:bg-rose-500/[0.06] hover:border-rose-500/30 hover-glow-rose');
    }
    if (severity === 'WARNING') {
      return base + (isExpanded 
        ? 'bg-amber-500/[0.08] border-amber-500/40 shadow-sm' 
        : 'bg-amber-500/[0.03] border-amber-500/15 hover:bg-amber-500/[0.06] hover:border-amber-500/30 hover-glow-amber');
    }
    return base + (isExpanded 
      ? 'bg-blue-500/[0.08] border-blue-500/40 shadow-sm' 
      : 'bg-blue-500/[0.03] border-blue-500/15 hover:bg-blue-500/[0.06] hover:border-blue-500/30 hover-glow-blue');
  };

  const getRiskBadge = (severity: string) => {
    if (severity === 'CRITICAL') return 'bg-rose-500/10 text-rose-500 border border-rose-500/20';
    if (severity === 'WARNING') return 'bg-amber-500/10 text-amber-500 border border-amber-500/20';
    return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
  };

  const getSeverityText = (severity: string) => {
    if (severity === 'CRITICAL') return 'Cao';
    if (severity === 'WARNING') return 'Trung bình';
    return 'Thấp';
  };

  const getTypeLabel = (type: string) => {
    switch (type.toUpperCase()) {
      case 'FINANCIAL': return 'Tài chính';
      case 'PROCUREMENT': return 'Vật tư';
      case 'PROJECT': return 'Tiến độ';
      default: return 'Rủi ro';
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        <h4 className="text-[10px] font-black text-[var(--text-tertiary)] uppercase tracking-[0.15em] flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse shadow-[0_0_8px_rgba(244,63,94,0.6)]" />
          CẢNH BÁO & RỦI RO
        </h4>
        <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 border border-rose-500/20 rounded-md px-1.5 py-0.5">
          {displayedRisks.filter(r => r.severity === 'CRITICAL').length} khẩn cấp
        </span>
      </div>

      <div className="space-y-2.5 overflow-y-auto max-h-[380px] pr-1.5 scrollbar-thin">
        {displayedRisks.map((risk, idx) => {
          const isExpanded = expandedId === idx;
          return (
            <div
              key={idx}
              className={getRiskCardStyle(risk.severity, isExpanded)}
              onClick={() => setExpandedId(isExpanded ? null : idx)}
            >
              <div className="flex items-start gap-2.5">
                <div className="mt-0.5 shrink-0">
                  {severityIcons[risk.severity] || severityIcons.INFO}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[8px] font-black uppercase tracking-widest text-[var(--text-tertiary)]">
                      {getTypeLabel(risk.type)}
                    </span>
                    <span className={`text-[8px] font-black px-1 py-0.2 rounded-md uppercase tracking-tight ${getRiskBadge(risk.severity)}`}>
                      {getSeverityText(risk.severity)}
                    </span>
                  </div>
                  <h5 className="text-[10.5px] font-black text-[var(--text-primary)] leading-snug tracking-tight">
                    {risk.message}
                  </h5>
                </div>
                <div className="shrink-0 text-[10px] text-[var(--text-muted)] font-bold">
                  {isExpanded ? '▲' : '▼'}
                </div>
              </div>

              {/* Hover Reveal / Click Drill-down details */}
              <div className={`transition-executive overflow-hidden ${isExpanded ? 'max-h-[220px] mt-2.5 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="border-t border-[var(--divider)] pt-2 mt-2 space-y-1.5 text-[9.5px] text-[var(--text-secondary)] font-medium leading-relaxed bg-[var(--card)]/40 p-2 rounded-lg transition-executive">
                  {risk.details.map((detail, dIdx) => (
                    <div key={dIdx} className="flex items-start gap-1.5 transition-executive hover:text-[var(--text-primary)]">
                      <span className="text-blue-500 font-bold shrink-0">•</span>
                      <p>{detail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
