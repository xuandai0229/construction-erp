"use client";

import React, { useState } from "react";
import { EnterpriseModal } from "@/app/components/ui-enterprise";

interface RejectReasonModalProps {
  isOpen: boolean;
  docNo: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({
  isOpen,
  docNo,
  onClose,
  onSubmit
}) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason || reason.trim().length < 5) {
      setError("Bắt buộc nhập lý do từ chối tối thiểu 5 ký tự.");
      return;
    }
    setError("");
    onSubmit(reason.trim());
    setReason("");
  };

  return (
    <EnterpriseModal
      isOpen={isOpen}
      onClose={onClose}
      title={`Từ chối chứng từ ${docNo}`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block text-xs font-bold text-[var(--text-secondary)] uppercase mb-2">
            Lý do từ chối <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (e.target.value.trim().length >= 5) setError("");
            }}
            placeholder="Nhập lý do chi tiết từ chối duyệt chứng từ này..."
            className="w-full h-28 px-3 py-2 border border-[var(--border)] bg-[var(--background)] text-[var(--text-primary)] rounded-xl text-sm focus:border-[var(--primary)] outline-none transition-all placeholder:[var(--text-muted)] resize-none"
            required
          />
          {error && <p className="text-xs text-rose-500 font-medium mt-1.5 flex items-center gap-1">⚠️ {error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-[var(--border)]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-[var(--text-primary)] bg-[var(--secondary)] hover:bg-[var(--secondary)]/80 rounded-xl border border-[var(--border)] transition-colors cursor-pointer"
          >
            Hủy bỏ
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-xl transition-colors cursor-pointer"
          >
            Xác nhận từ chối
          </button>
        </div>
      </form>
    </EnterpriseModal>
  );
};
