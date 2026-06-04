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
      setError("B\u1eaft bu\u1ed9c nh\u1eadp l\u00fd do t\u1eeb ch\u1ed1i t\u1ed1i thi\u1ec3u 5 k\u00fd t\u1ef1.");
      return;
    }
    setError("");
    onSubmit(reason.trim());
    setReason("");
  };

  return (
    <EnterpriseModal isOpen={isOpen} onClose={onClose} title={`T\u1eeb ch\u1ed1i ch\u1ee9ng t\u1eeb ${docNo}`} maxWidth="md">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div className="rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[11px] leading-5 text-amber-700 dark:text-amber-300">
          T\u1eeb ch\u1ed1i s\u1ebd chuy\u1ec3n ch\u1ee9ng t\u1eeb v\u1ec1 tr\u1ea1ng th\u00e1i c\u1ea7n b\u1ed5 sung. Vui l\u00f2ng ghi r\u00f5 l\u00fd do \u0111\u1ec3 ng\u01b0\u1eddi t\u1ea1o x\u1eed l\u00fd \u0111\u00fang.
        </div>
        <div>
          <label className="mb-2 block text-xs font-bold uppercase text-[var(--text-secondary)]">
            L\u00fd do t\u1eeb ch\u1ed1i <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(event) => {
              setReason(event.target.value);
              if (event.target.value.trim().length >= 5) setError("");
            }}
            placeholder="Nh\u1eadp l\u00fd do t\u1eeb ch\u1ed1i ch\u1ee9ng t\u1eeb n\u00e0y..."
            className="h-28 w-full resize-none rounded-lg border border-[var(--border)] bg-[var(--background)] px-3 py-2 text-sm text-[var(--text-primary)] outline-none transition-all placeholder:text-[var(--text-muted)] focus:border-[var(--primary)]"
            required
          />
          {error && <p className="mt-1.5 text-xs font-semibold text-rose-500">{error}</p>}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-[var(--border)] pt-4">
          <button type="button" onClick={onClose} className="rounded-md border border-[var(--border)] bg-[var(--secondary)] px-4 py-2 text-sm font-semibold text-[var(--text-primary)] hover:bg-[var(--secondary)]/80">
            H\u1ee7y b\u1ecf
          </button>
          <button type="submit" className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500">
            X\u00e1c nh\u1eadn t\u1eeb ch\u1ed1i
          </button>
        </div>
      </form>
    </EnterpriseModal>
  );
};
