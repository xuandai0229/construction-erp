"use client";

import React, { useState } from "react";
import { EnterpriseModal } from "@/app/components/ui-enterprise";

interface RejectReasonModalProps {
  isOpen: boolean;
  docNo: string;
  onClose: () => void;
  onSubmit: (reason: string) => void;
}

export const RejectReasonModal: React.FC<RejectReasonModalProps> = ({ isOpen, docNo, onClose, onSubmit }) => {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (reason.trim().length < 5) {
      setError("Bắt buộc nhập lý do từ chối tối thiểu 5 ký tự.");
      return;
    }
    setError("");
    onSubmit(reason.trim());
    setReason("");
  };

  return (
    <EnterpriseModal isOpen={isOpen} onClose={onClose} title={`Từ chối chứng từ ${docNo}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-5 text-amber-700 dark:text-amber-300">
          Từ chối sẽ chuyển chứng từ về trạng thái cần bổ sung. Vui lòng ghi rõ lý do để người tạo xử lý đúng.
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-[var(--text-secondary)]">
            Lý do từ chối <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (event.target.value.trim().length >= 5) setError("");
            }}
            placeholder="Nhập lý do từ chối chứng từ này..."
            className="h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            required
          />
          {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onClose} className="rounded-md border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--secondary)]/80">
            Hủy bỏ
          </button>
          <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">
            Xác nhận từ chối
          </button>
        </div>
      </form>
    </EnterpriseModal>
  );
};
