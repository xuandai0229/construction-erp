"use client";

import React, { useState } from "react";

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-zinc-100 overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="px-6 py-5 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
          <h3 className="text-base font-semibold text-zinc-950">Từ chối chứng từ {docNo}</h3>
          <button onClick={onClose} className="p-1.5 text-zinc-400 hover:text-zinc-600 rounded-lg hover:bg-zinc-100 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-semibold text-zinc-700 mb-1.5">Lý do từ chối <span className="text-rose-500">*</span></label>
              <textarea
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim().length >= 5) setError("");
                }}
                placeholder="Nhập lý do chi tiết từ chối duyệt chứng từ này..."
                className="w-full h-28 px-3 py-2 border border-zinc-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all placeholder:text-zinc-400 resize-none"
                required
              />
              {error && <p className="text-xs text-rose-600 font-medium mt-1.5 flex items-center gap-1">⚠️ {error}</p>}
            </div>
          </div>
          <div className="px-6 py-4 bg-zinc-50 border-t border-zinc-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-zinc-700 bg-white hover:bg-zinc-50 border border-zinc-200 rounded-xl transition-all"
            >
              Hủy bỏ
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-sm hover:shadow transition-all"
            >
              Xác nhận từ chối
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
