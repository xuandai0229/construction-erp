"use client";

import React from "react";
import { ApprovalTimeline } from "./ApprovalTimeline";
import { getStatusLabel, getStatusStyleClass } from "@/app/components/ui-enterprise";

interface PendingDoc {
  id: string;
  module: string;
  docNo: string;
  projectId: string;
  projectName: string;
  amount: number;
  createdById: string;
  creatorName: string;
  createdAt: Date | string;
  status: string;
}

interface ApprovalDetailDrawerProps {
  isOpen: boolean;
  document: PendingDoc | null;
  currentUserId: string;
  onClose: () => void;
  onApprove: (doc: PendingDoc) => void;
  onRejectClick: (doc: PendingDoc) => void;
}

export const ApprovalDetailDrawer: React.FC<ApprovalDetailDrawerProps> = ({
  isOpen,
  document,
  currentUserId,
  onClose,
  onApprove,
  onRejectClick
}) => {
  if (!isOpen || !document) return null;

  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  const getSourceLink = () => {
    switch (document.module) {
      case "INVOICE":
        return `/revenue?invoiceId=${document.id}`;
      case "COST":
        return `/costs?costId=${document.id}`;
      case "ADVANCE":
        return `/settings?tab=advance&id=${document.id}`;
      case "SETTLEMENT":
        return `/settings?tab=settlement&id=${document.id}`;
      default:
        return "#";
    }
  };

  const isCreator = document.createdById === currentUserId;
  const canAction = document.status === "PENDING" || document.status === "SUBMITTED";

  const getModuleLabel = (mod: string) => {
    switch (mod) {
      case "INVOICE": return "Hóa đơn VAT";
      case "COST": return "Chi phí công trình";
      case "ADVANCE": return "Đề xuất Tạm ứng";
      case "SETTLEMENT": return "Hồ sơ Quyết toán";
      default: return mod;
    }
  };

  // Mock timelines for visual gorgeousness based on state
  const mockTimeline = [
    {
      label: "Khởi tạo chứng từ",
      role: "Người đề xuất",
      user: document.creatorName,
      time: document.createdAt,
      status: "completed" as const
    },
    {
      label: "Kiểm tra kỹ thuật & khối lượng",
      role: "Trưởng ban QLDA",
      user: "Nguyễn Văn Trưởng",
      time: new Date(new Date(document.createdAt).getTime() + 3600000),
      status: "completed" as const
    },
    {
      label: "Duyệt chi & Phân bổ dòng tiền",
      role: "Giám đốc tài chính (CFO)",
      user: document.status === "APPROVED" || document.status === "POSTED" ? "Quản trị viên hệ thống" : "Đang chờ phê duyệt",
      time: document.status === "APPROVED" || document.status === "POSTED" ? new Date() : undefined,
      status: document.status === "APPROVED" || document.status === "POSTED" ? ("completed" as const) : ("current" as const)
    }
  ];

  return (
    <div className="fixed inset-0 z-40 overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity" onClick={onClose} />

      <div className="absolute inset-y-0 right-0 max-w-lg w-full flex pl-10">
        <div className="w-screen max-w-md bg-[var(--card)] border-l border-[var(--border)] shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-250">
          {/* Header */}
          <div className="px-6 py-5 border-b border-[var(--border)] flex items-center justify-between bg-[var(--secondary)] shrink-0">
            <div>
              <h2 className="text-base font-semibold text-[var(--text-primary)]">Chi Tiết Chứng Từ</h2>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">Số hiệu: {document.docNo}</p>
            </div>
            <button 
              onClick={onClose} 
              className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--secondary)]/80 transition-colors cursor-pointer"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin">
            {/* Info Grid */}
            <div className="bg-[var(--background)]/50 rounded-2xl border border-[var(--border)] p-5 space-y-4 text-xs">
              <div className="flex justify-between items-center text-sm border-b border-[var(--border)] pb-3">
                <span className="text-[var(--text-muted)] font-medium">Phân hệ:</span>
                <span className="font-semibold text-[var(--text-primary)]">{getModuleLabel(document.module)}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[var(--border)] pb-3">
                <span className="text-[var(--text-muted)] font-medium">Người tạo:</span>
                <span className="font-semibold text-[var(--text-primary)]">{document.creatorName}</span>
              </div>
              <div className="flex justify-between items-center text-sm border-b border-[var(--border)] pb-3">
                <span className="text-[var(--text-muted)] font-medium">Dự án:</span>
                <span className="font-semibold text-[var(--text-primary)] max-w-[200px] truncate text-right">{document.projectName}</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-[var(--text-muted)] font-medium">Trạng thái:</span>
                <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase tracking-wider ${getStatusStyleClass(document.status)}`}>
                  {getStatusLabel(document.status)}
                </span>
              </div>
            </div>

            {/* Value Block */}
            <div className="bg-[var(--primary)]/5 rounded-2xl border border-[var(--primary)]/20 p-5 text-center">
              <span className="text-[10px] text-[var(--primary)] font-bold uppercase tracking-wider">Tổng giá trị thanh toán</span>
              <h3 className="text-2xl font-black text-[var(--primary)] mt-1">{formatVND(document.amount)}</h3>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-4">Quy trình phê duyệt</h3>
              <ApprovalTimeline steps={mockTimeline} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[var(--secondary)] border-t border-[var(--border)] flex flex-col gap-3 shrink-0">
            <a
              href={getSourceLink()}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 text-center text-sm font-semibold text-[var(--text-primary)] bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] rounded-xl shadow-xs transition-all flex items-center justify-center gap-1.5"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              Xem tài liệu gốc
            </a>

            {canAction && (
              isCreator ? (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-center">
                  <span className="text-xs font-bold text-amber-500 block">⚠️ CHẶN PHÊ DUYỆT (SoD)</span>
                  <span className="text-[11px] text-amber-500/90 mt-0.5 block">Bạn là người tạo chứng từ này. Hệ thống chặn quyền tự phê duyệt để đảm bảo tính minh bạch.</span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onApprove(document)}
                    className="flex-1 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-colors cursor-pointer"
                  >
                    Phê duyệt
                  </button>
                  <button
                    onClick={() => onRejectClick(document)}
                    className="flex-1 py-2.5 text-sm font-semibold text-[var(--text-primary)] bg-[var(--card)] hover:bg-[var(--secondary)] border border-[var(--border)] rounded-xl transition-all cursor-pointer"
                  >
                    Từ chối
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
