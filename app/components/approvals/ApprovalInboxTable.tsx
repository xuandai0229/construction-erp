"use client";

import React from "react";
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

interface ApprovalInboxTableProps {
  documents: PendingDoc[];
  currentUserId: string;
  onSelect: (doc: PendingDoc) => void;
  onApprove: (doc: PendingDoc) => void;
  onRejectClick: (doc: PendingDoc) => void;
}

export const ApprovalInboxTable: React.FC<ApprovalInboxTableProps> = ({
  documents,
  currentUserId,
  onSelect,
  onApprove,
  onRejectClick
}) => {
  const formatVND = (num: number) => {
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(num);
  };

  const getModuleBadge = (mod: string) => {
    switch (mod) {
      case "INVOICE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">Hóa đơn</span>;
      case "COST":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/20">Chi phí</span>;
      case "ADVANCE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">Tạm ứng</span>;
      case "SETTLEMENT":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20">Quyết toán</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-[var(--secondary)] text-[var(--text-secondary)] border border-[var(--border)]">{mod}</span>;
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-[var(--card)] rounded-xl border border-[var(--border)]">
        <p className="text-[var(--text-muted)] text-sm">Không tìm thấy chứng từ nào phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-[var(--border)]">
          <thead className="bg-[var(--secondary)] text-[var(--text-secondary)]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Số chứng từ</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Phân hệ</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Công trình / Dự án</th>
              <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider">Giá trị (VND)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Người đề xuất</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-center text-xs font-semibold uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)] text-[var(--text-primary)]">
            {documents.map((doc) => {
              const isCreator = doc.createdById === currentUserId;
              const canAction = doc.status === "PENDING" || doc.status === "SUBMITTED";

              return (
                <tr 
                  key={doc.id} 
                  className="hover:bg-[var(--secondary)]/25 transition-colors group cursor-pointer" 
                  onClick={() => onSelect(doc)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-[var(--primary)] group-hover:underline">
                    {doc.docNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getModuleBadge(doc.module)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)] max-w-[200px] truncate">
                    {doc.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-mono font-semibold">
                    {formatVND(doc.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-secondary)]">{doc.creatorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--text-muted)]">
                    {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium uppercase tracking-wider ${getStatusStyleClass(doc.status)}`}>
                      {getStatusLabel(doc.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center" onClick={(e) => e.stopPropagation()}>
                    {canAction ? (
                      isCreator ? (
                        <span className="text-xs text-amber-500 font-medium bg-amber-500/10 px-2.5 py-1 rounded-md border border-amber-500/20">
                          Bất kiêm nhiệm chặn duyệt
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onApprove(doc)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg shadow-sm transition-colors cursor-pointer"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => onRejectClick(doc)}
                            className="px-3 py-1.5 text-xs font-semibold text-[var(--text-primary)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/70 rounded-lg border border-[var(--border)] transition-colors cursor-pointer"
                          >
                            Từ chối
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-[var(--text-muted)] text-xs">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
