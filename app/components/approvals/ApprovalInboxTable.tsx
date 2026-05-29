"use client";

import React from "react";

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
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">Hóa đơn</span>;
      case "COST":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-amber-50 text-amber-700 border border-amber-100">Chi phí</span>;
      case "ADVANCE":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-50 text-blue-700 border border-blue-100">Tạm ứng</span>;
      case "SETTLEMENT":
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-purple-50 text-purple-700 border border-purple-100">Quyết toán</span>;
      default:
        return <span className="px-2.5 py-1 text-xs font-semibold rounded-full bg-zinc-50 text-zinc-700">{mod}</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
      case "SUBMITTED":
        return <span className="inline-flex items-center text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">Chờ duyệt</span>;
      case "APPROVED":
        return <span className="inline-flex items-center text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">Đã duyệt</span>;
      case "POSTED":
        return <span className="inline-flex items-center text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">Đã ghi sổ</span>;
      case "DRAFT":
        return <span className="inline-flex items-center text-xs font-medium text-zinc-600 bg-zinc-50 px-2 py-0.5 rounded-full border border-zinc-100">Nháp</span>;
      default:
        return <span className="inline-flex items-center text-xs font-medium text-zinc-500 bg-zinc-50 px-2 py-0.5 rounded border border-zinc-100">{status}</span>;
    }
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-zinc-100 shadow-sm">
        <p className="text-zinc-400 text-sm">Không tìm thấy chứng từ nào phù hợp với bộ lọc.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-zinc-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-zinc-100">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Số chứng từ</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Phân hệ</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Công trình / Dự án</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-zinc-500 uppercase tracking-wider">Giá trị (VND)</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Người đề xuất</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ngày tạo</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wider">Trạng thái</th>
              <th className="px-6 py-4 text-center text-xs font-semibold text-zinc-500 uppercase tracking-wider">Thao tác</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {documents.map((doc) => {
              const isCreator = doc.createdById === currentUserId;
              const canAction = doc.status === "PENDING" || doc.status === "SUBMITTED";

              return (
                <tr key={doc.id} className="hover:bg-zinc-50/50 transition-colors group cursor-pointer" onClick={() => onSelect(doc)}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-zinc-950 group-hover:text-blue-600 transition-colors">
                    {doc.docNo}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getModuleBadge(doc.module)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600 max-w-[200px] truncate">
                    {doc.projectName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-zinc-950">
                    {formatVND(doc.amount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-600">{doc.creatorName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">
                    {new Date(doc.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{getStatusBadge(doc.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center" onClick={(e) => e.stopPropagation()}>
                    {canAction ? (
                      isCreator ? (
                        <span className="text-xs text-amber-500 font-medium bg-amber-50 px-2 py-1 rounded-md border border-amber-100">
                          Bất kiêm nhiệm chặn duyệt
                        </span>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => onApprove(doc)}
                            className="px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm hover:shadow transition-all"
                          >
                            Duyệt
                          </button>
                          <button
                            onClick={() => onRejectClick(doc)}
                            className="px-3 py-1.5 text-xs font-semibold text-zinc-700 bg-zinc-100 hover:bg-zinc-200 rounded-lg transition-colors"
                          >
                            Từ chối
                          </button>
                        </div>
                      )
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
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
